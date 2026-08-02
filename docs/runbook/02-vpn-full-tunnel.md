# 02. Full-tunnel VPN для исходящего трафика

Задача: **весь исходящий** трафик сервера (хост + все контейнеры) уходит через
VPN, но сервер остаётся доступен снаружи по своему реальному IP — SSH и сайт
работают как обычно.

Зачем: из РФ многие API недоступны напрямую (`api.telegram.org`, часть npm-зеркал,
внешние сервисы). Через VPN-выход они работают.

> ⚠️ **Это самая опасная операция в рунбуке.** Full-tunnel по SSH — это пилить
> ветку, на которой сидишь: ошибка в правилах отрезает доступ к серверу, лечится
> только через консоль хостера. Поэтому ниже обязателен watchdog.

## Как это работает (в двух абзацах)

Обычно сервер ходит в интернет через провайдера. `AllowedIPs = 0.0.0.0/0` в
конфиге означает «заворачивай в туннель вообще всё». Проблема: когда снаружи
кто-то стучится на SSH или на сайт, сервер по этому правилу пытается **ответить
тоже через туннель** — а ответ там теряется, потому что гость пришёл по обычной
дороге. Соединение зависает.

Решение — «цветной браслет»: на каждое **новое входящее** соединение на порты
22/80/443 вешается метка `connmark 0x2`, и для помеченных пакетов действует
отдельная таблица маршрутизации с обычным шлюзом. Ответ уходит тем же путём,
каким пришёл запрос. Всё остальное продолжает уходить в туннель.

## Что понадобится

- Конфиг VPN (`vpn.conf`). Если в нём есть поля `Jc/Jmin/Jmax/S1/S2/H1..H4` —
  это **AmneziaWG** (WireGuard с маскировкой), обычный `wg-quick` его не поймёт.
- `<GATEWAY>`, `<IFACE>`, IPv6-шлюз — из [01-server-setup.md](01-server-setup.md).

## 1. Установить AmneziaWG

Сначала пробуем пакеты:

```bash
add-apt-repository -y ppa:amnezia/ppa && apt-get update -qq
apt-get install -y amneziawg-dkms amneziawg-tools
```

**Если пакетов нет** (частый случай на свежих Ubuntu — в PPA нет сборки под
новый релиз, а модуля ядра не существует для новых ядер) — собираем
**userspace-версию** из исходников. Она не зависит от версии ядра:

```bash
apt-get install -y -qq git make build-essential golang-go
cd /root
git clone --depth 1 https://github.com/amnezia-vpn/amneziawg-go
git clone --depth 1 https://github.com/amnezia-vpn/amneziawg-tools

cd /root/amneziawg-go && make && install -m755 amneziawg-go /usr/bin/amneziawg-go
cd /root/amneziawg-tools/src && make && make install
```

Проверка:

```bash
awg --version && awg-quick --help >/dev/null && amneziawg-go --version
```

## 2. Положить конфиг

```bash
install -d -m 700 /etc/amnezia/amneziawg
cp vpn.conf /etc/amnezia/amneziawg/awg0.conf
chmod 600 /etc/amnezia/amneziawg/awg0.conf
```

## 3. Установить скрипты

Скопируйте из [templates/](templates/) на сервер и **отредактируйте переменные**
в начале `vpn-exempt.sh` (`V4GW`, `V4DEV`, `V6GW`, `V6DEV`):

```bash
install -m755 vpn-exempt.sh vpn-up.sh vpn-down.sh /usr/local/sbin/
install -m644 vpn-fulltunnel.service /etc/systemd/system/
systemctl daemon-reload
```

## 4. Поднять — безопасно, с автооткатом

Никогда не поднимайте туннель «просто так»: если правила ошибочны, SSH умрёт.
Схема — watchdog, который сам всё откатит через 150 секунд, если не подтвердить:

```bash
rm -f /tmp/vpn_confirmed
systemctl reset-failed vpn-watchdog vpn-trigger 2>/dev/null

# сторож: через 150с откатит VPN, если нет /tmp/vpn_confirmed
systemd-run --unit=vpn-watchdog --collect --no-block \
  bash -c 'for i in $(seq 1 150); do [ -f /tmp/vpn_confirmed ] && exit 0; sleep 1; done; systemctl stop vpn-fulltunnel'

# подъём отдельным процессом, чтобы обрыв SSH его не убил
systemd-run --unit=vpn-trigger --collect --no-block systemctl start vpn-fulltunnel
```

Теперь **из другого окна / новым подключением** проверить:

```bash
ssh root@<SERVER_IP> 'ip link show awg0 >/dev/null && echo TUNNEL_UP; curl -4 -s --max-time 8 https://api.ipify.org; echo'
```

- SSH ответил **и** IP сменился на адрес VPN-выхода → успех, фиксируем:

  ```bash
  touch /tmp/vpn_confirmed
  systemctl stop vpn-watchdog; systemctl reset-failed vpn-watchdog
  systemctl enable vpn-fulltunnel     # автозапуск при перезагрузке
  ```

- SSH не отвечает → **ничего не делайте**, через 150 секунд watchdog сам вернёт
  доступ. Потом разбирайтесь по разделу «Грабли».

## 5. Проверить, что контейнеры тоже ходят через VPN

```bash
docker run --rm curlimages/curl -s --max-time 10 https://api.ipify.org; echo
```

Должен вернуться IP VPN-выхода, а не сервера.

---

## Грабли (все были собраны на практике)

Если делаете это руками или через ИИ — вот полный список того, на чём
спотыкаются. Каждый пункт стоил отдельной отладки.

### 1. Приоритет ip-правил vs awg-quick

`awg-quick` при подъёме ставит свои правила **на 1–2 ниже самого низкого
пользовательского**. Если добавить своё правило до подъёма туннеля, оно
окажется ниже, и помеченные пакеты всё равно уйдут в туннель.

**Правильно:** сначала `awg-quick up`, потом добавлять своё правило (pref 50).
Именно в таком порядке в `vpn-up.sh`.

Проверка: `ip rule show` — ваше `fwmark 0x2 lookup 200` должно быть **выше**
правил `awg` (у них будет ~32764/32765).

### 2. Петля маршрутизации (симптом: сотни МБ отправлено за секунды)

`awg` помечает свои **зашифрованные** пакеты меткой `0xca6c`. Если восстанавливать
connmark в `OUTPUT` для всего трафика, эта метка затирается → зашифрованные
пакеты снова попадают в туннель → бесконечная петля.

**Правильно:** восстанавливать метку только для соединений с меткой `0x2`:

```
iptables -t mangle -A OUTPUT -m connmark --mark 0x2 -j CONNMARK --restore-mark
```

Симптом петли виден в `awg show`: огромный `transfer sent` при почти нулевом
`received`.

### 3. Контейнеры недоступны снаружи (сайт не открывается, SSH жив)

Если восстанавливать метку в `PREROUTING` для входящего трафика, метка ляжет и на
SYN-пакет. После DNAT в docker-сеть пакет с меткой `0x2` уйдёт в таблицу 200, где
нет маршрута к подсети docker → трафик к контейнеру теряется.

**Правильно:** в `PREROUTING` восстанавливать метку только для трафика,
пришедшего **не** с внешнего интерфейса (это ответы из контейнеров):

```
iptables -t mangle -A PREROUTING ! -i <IFACE> -m connmark --mark 0x2 -j CONNMARK --restore-mark
```

Диагностика: `tcpdump -ni <IFACE> tcp port 80` видит входящие SYN, а
`tcpdump -ni br-<id> port 80` (docker-мост) — нет.

### 4. Userspace-демон умирает сразу после старта

`amneziawg-go` — обычный процесс. Если запускать его из transient-юнита
(`systemd-run` с Type=simple), systemd убьёт его вместе с завершением юнита,
и интерфейс `awg0` исчезнет.

**Правильно:** oneshot-сервис с `RemainAfterExit=yes` (см. шаблон
`vpn-fulltunnel.service`).

### 5. Зависают загрузки (npm install, docker pull, большие ответы API)

MTU туннеля меньше обычного (в конфигах Amnezia обычно 1380). Без clamping
крупные пакеты не проходят, соединение «висит».

**Правильно:** MSS clamping на выход в туннель (уже есть в `vpn-exempt.sh`):

```
iptables -t mangle -A POSTROUTING -o awg0 -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu
```

### 6. Порты 80/443 обязательно в списке исключений

Если исключить только SSH (22), сервер останется управляемым, но **сайт станет
недоступен** снаружи. В `PORTS` должны быть `22,80,443`.

---

## Эксплуатация

```bash
systemctl status vpn-fulltunnel     # состояние
awg show awg0                       # хэндшейк и объём трафика
systemctl restart vpn-fulltunnel    # переподнять туннель
systemctl stop vpn-fulltunnel       # выключить VPN (трафик пойдёт напрямую)

curl -4 -s https://api.ipify.org    # текущий внешний IP
ip rule show                        # порядок правил маршрутизации
```

Признаки здорового туннеля в `awg show`: свежий `latest handshake` (секунды/
десятки секунд) и **сопоставимые** значения received/sent.
