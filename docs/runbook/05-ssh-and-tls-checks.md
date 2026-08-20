# Работа с сервером: ssh, деплой, проверки TLS

Практические приёмы, чтобы не тратить время на одни и те же грабли при каждом
деплое. Проверено на боевом сервере `nyraflow.ru` / `app.nyraflow.ru`.

## Постоянная ssh-сессия

Каждая новая ssh-команда — это новый TCP- и крипто-хендшейк. Если канал до
сервера нестабилен (а он бывает нестабилен волнами), половина команд отваливается
с `Connection timed out`. Лечится мультиплексированием: одно соединение держится
открытым, все следующие команды идут в него.

Готовый скрипт — [templates/srv.sh](templates/srv.sh). Скопируйте, подставьте
адрес сервера:

```bash
cp docs/runbook/templates/srv.sh ~/bin/srv && chmod +x ~/bin/srv
srv 'docker compose ps'
srv 'cd /opt/PROJECT && docker compose logs -f app'
```

Ключевые опции и зачем они:

| Опция | Зачем |
|---|---|
| `-o ControlMaster=auto -o ControlPath=... -o ControlPersist=30m` | Держит один канал 30 минут, остальные команды переиспользуют его |
| `-n` | Отвязывает stdin. Без этого ssh может подвиснуть, ожидая ввод |
| `-o ConnectionAttempts=3` | Автоповтор хендшейка при обрыве |
| `-o ServerAliveInterval=15` | Не даёт NAT/файрволу молча схлопнуть сессию |

**Грабля 1: длина пути к сокету.** Лимит имени unix-сокета — 104 символа. Путь
во временном каталоге легко его превышает, и вы получите:

```
unix_listener: path "/very/long/path/ssh-ctl.XXXX" too long for Unix domain socket
```

Держите сокет коротким путём: `/tmp/ssh-ctl-project.sock`.

**Грабля 2: `-n` ломает rsync.** В транспорте для rsync флаг `-n` использовать
нельзя — rsync общается с удалённой стороной через stdin/stdout, и с `/dev/null`
на входе вы получите `connection unexpectedly closed (0 bytes received)`:

```bash
# неправильно
rsync -a -e "ssh -n" ./ root@SERVER:/opt/PROJECT/
# правильно
rsync -a -e "ssh -o BatchMode=yes -o ConnectTimeout=20" ./ root@SERVER:/opt/PROJECT/
```

## Вход по паролю без sshpass

Если `sshpass` не установлен, а sudo для его установки недоступен, штатный
механизм OpenSSH решает задачу:

```bash
printf '%s\n' 'ПАРОЛЬ' > /tmp/askpass.sh && chmod 700 /tmp/askpass.sh
# внутри файла: #!/bin/sh + printf пароля

SSH_ASKPASS=/tmp/askpass.sh SSH_ASKPASS_REQUIRE=force DISPLAY=:0 \
  ssh root@SERVER 'echo ok'
```

`SSH_ASKPASS_REQUIRE=force` заставляет ssh спрашивать пароль у скрипта, даже
когда есть терминал. Сразу после первого входа поставьте ключ и забудьте про
пароль:

```bash
SSH_ASKPASS=/tmp/askpass.sh SSH_ASKPASS_REQUIRE=force DISPLAY=:0 ssh-copy-id root@SERVER
ssh -o BatchMode=yes root@SERVER 'echo KEY_OK'   # проверка: должно пройти без пароля
rm -f /tmp/askpass.sh
```

## Долгие задачи переживают обрыв связи

Если канал рвётся, обычная команда умирает вместе с сессией. Запускайте отдельным
процессом с выводом в файл и забирайте результат отдельно:

```bash
srv 'nohup setsid python3 -u /tmp/script.py > /tmp/script.out 2>&1 < /dev/null & echo запущен'
srv 'pgrep -f script.py >/dev/null && echo ИДЁТ || echo ГОТОВО; cat /tmp/script.out'
```

**Важно: `python3 -u`.** Без него Python буферизует вывод, когда пишет в файл, и
вы будете смотреть на пустой `script.out`, думая, что скрипт висит.

**Проверяйте, что не запущено несколько копий.** Оборвавшиеся сессии оставляют
процессы жить. Они конкурируют за лимиты API и искажают замеры:

```bash
srv 'pgrep -af script.py'
srv 'pkill -f script.py'
```

## Проверка DNS

**С сервера прямые DNS-запросы не работают.** Весь исходящий трафик идёт через
VPN, UDP 53 наружу закрыт, поэтому `dig @ns1.reg.ru ...` вернёт
`no servers could be reached`. Спрашивайте через DoH по HTTPS:

```bash
# Cloudflare
curl -s -H "accept: application/dns-json" \
  "https://cloudflare-dns.com/dns-query?name=app.example.ru&type=A"
# Google
curl -s "https://dns.google/resolve?name=app.example.ru&type=A"
```

`"Status":0` с блоком `Answer` — запись видна. `"Status":3` — NXDOMAIN.

**Грабля: отрицательный кеш.** Если вы спросили резолвер до создания записи, он
запомнит «домена нет» на время из последнего поля SOA (у reg.ru это 3 часа).
Свежесозданная запись может быть видна одному резолверу и не видна другому —
это нормально. Проверяйте у нескольких и не паникуйте.

Для проверки сайта в обход локального кеша:

```bash
curl --resolve app.example.ru:443:IP_СЕРВЕРА https://app.example.ru/api/health
```

## Проверка TLS и деплоя

Порядок такой: сначала DNS, потом сертификат, потом приложение.

```bash
# 1. валидность конфига Caddy БЕЗ перезапуска (безопасно для живого сайта)
srv 'cd /opt/PROJECT && docker compose exec -T caddy \
      caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile'

# 2. применить конфиг без даунтайма (reload, а не restart)
srv 'cd /opt/PROJECT && docker compose exec -T caddy \
      caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile'

# 3. сертификат: кем выдан и до какого числа
curl -sv --max-time 20 https://app.example.ru 2>&1 | grep -iE "issuer|subject:|expire date"

# 4. приложение живо и видит базу
curl -s https://app.example.ru/api/health

# 5. старый сайт не пострадал
curl -s -o /dev/null -w "%{http_code}\n" https://example.ru
```

Ожидаемый результат третьего шага:

```
* subject: CN=app.example.ru
* expire date: Nov 17 13:53:01 2026 GMT
* issuer: C=US; O=Let's Encrypt; CN=YE1
```

**Грабля: rsync обновил Caddyfile, а контейнер видит старый.** Docker монтирует
одиночный файл по inode. `rsync`, `mv` и большинство редакторов не дописывают
файл, а создают новый и переименовывают — inode меняется, bind-mount рвётся, и
контейнер продолжает читать старую версию. Симптом коварный: `caddy validate` и
`caddy reload` отрабатывают успешно, потому что старый конфиг тоже валиден, а
нового домена в нём просто нет.

Проверка:

```bash
srv 'cd /opt/PROJECT && docker compose exec -T caddy grep -c "новый.домен" /etc/caddy/Caddyfile'
```

Ноль означает, что контейнер смотрит в старый файл. Дальше важно различать два
случая — лечатся они по-разному.

**Файл ещё не подменяли** (правите его на сервере впервые после запуска
контейнера). Тогда достаточно писать *на место*, не создавая новый файл, и
конфиг подхватится обычным reload:

```bash
scp Caddyfile root@SERVER:/tmp/Caddyfile.new
srv 'cat /tmp/Caddyfile.new > /opt/PROJECT/Caddyfile'   # усечение + запись, inode тот же
srv 'cd /opt/PROJECT && docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile'
```

**Файл уже подменён** (rsync отработал раньше, чем вы спохватились) — а это
обычный случай, потому что rsync входит в стандартный деплой. Здесь запись на
место бесполезна: контейнер держит старый inode с момента старта и в новый файл
не заглянет, сколько его ни переписывай. Помогает только пересоздание:

```bash
srv 'cd /opt/PROJECT && docker compose up -d --force-recreate caddy'
srv 'cd /opt/PROJECT && docker compose exec -T caddy grep -c "новый.домен" /etc/caddy/Caddyfile'
```

Это одна-две секунды недоступности всех сайтов на этом Caddy — делайте осознанно
и сразу проверяйте, что домены вернулись.

То же касается любого одиночного файла в bind-mount: `.env`, конфигов, ключей.
Каталоги монтируются иначе и этой проблемы не имеют.

**Не перезапускайте Caddy, пока не создана DNS-запись.** Он начнёт запрашивать
сертификат, получать отказы и упрётся в лимит Let's Encrypt — 5 неудачных
проверок в час на домен. Порядок всегда: сначала `A`-запись, убедились через
DoH, потом `caddy reload`.

**`reload` вместо `restart`.** Перезапуск контейнера роняет все сайты на
несколько секунд, `caddy reload` подхватывает конфиг без разрыва соединений.

## Один сервер, два проекта: не затирайте чужое

Лендинг и мини-апп лежат в одном репозитории и деплоятся в один каталог на
сервере. Соблазн синхронизировать всё разом заканчивается плохо:

```bash
# ОПАСНО: перезапишет исходники лендинга своими версиями
rsync -a ./ root@SERVER:/opt/PROJECT/
```

Если лендинг правят с другой машины (или в другой ветке), такой rsync молча
откатывает чужие изменения. Коварство в том, что **сайт продолжает работать** —
он крутится на уже собранном образе. Поломка всплывёт при следующей пересборке,
когда связь с причиной давно потеряна.

Признак, по которому это ловится:

```bash
srv 'cd /opt/PROJECT && ls -l --time-style="+%d.%m %H:%M" app/page.tsx components/*.tsx | head'
srv 'cd /opt/PROJECT && find app components -type f -user 501'   # чужой uid = чужие файлы
```

Разные владельцы и разные даты в одном каталоге означают, что проекты
перетирают друг друга.

Правильный путь — белый список того, что передаём:

```bash
rsync -a --exclude node_modules --exclude .next -e "ssh ..." \
  ./miniapp/ root@SERVER:/opt/PROJECT/miniapp/
rsync -a -e "ssh ..." ./docker-compose.yml root@SERVER:/opt/PROJECT/docker-compose.yml
```

Готовый скрипт — [templates/deploy-miniapp.sh](templates/deploy-miniapp.sh).
Список исключений забывают дополнить, белый список ошибается в безопасную
сторону.

## Диагностика: сервер лёг или канал?

Если ssh не отвечает, это ещё не значит, что сервер мёртв:

```bash
curl -s -o /dev/null -w "%{http_code}\n" --max-time 20 https://example.ru   # сайт
timeout 15 bash -c 'cat < /dev/null > /dev/tcp/SERVER_IP/22' && echo "порт 22 открыт"
```

| Симптом | Диагноз |
|---|---|
| Сайт 200, порт 22 открыт, ssh рвётся | Нестабильный канал до сервера, помогают ретраи |
| Сайт 200, порт 22 закрыт | Проблема с sshd или файрволом (fail2ban?) |
| Всё молчит | Сервер или сеть провайдера |

Один и тот же адрес может отвечать `200`, а соседний домен на том же сервере —
`000`. Это потери пакетов на маршруте, а не поломка сервера.
