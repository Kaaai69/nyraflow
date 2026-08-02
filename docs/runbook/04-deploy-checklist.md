# 04. Чек-лист запуска лендинга

Пройти сверху вниз. Каждый пункт — проверяемый, без «кажется работает».

## До деплоя

- [ ] Сервер подготовлен, Docker установлен → [01](01-server-setup.md)
      `docker --version && docker compose version`
- [ ] VPN поднят и работает (если нужен) → [02](02-vpn-full-tunnel.md)
      `systemctl is-active vpn-fulltunnel && curl -4 -s https://api.ipify.org`
- [ ] Домен: A-запись `<DOMAIN>` и `www.<DOMAIN>` → `<SERVER_IP>`
      `dig +short <DOMAIN> @8.8.8.8`
- [ ] В репозитории есть `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `Caddyfile`
- [ ] `.dockerignore` содержит `.env*` и файлы с ключами
- [ ] Для Next.js SSR: в `next.config.ts` стоит `output: "standalone"`
- [ ] Локально проходит сборка: `npm run build`

## Деплой

- [ ] Код скопирован в `/opt/<PROJECT>` без `node_modules`, `.next`, `.git`, секретов
- [ ] `/opt/<PROJECT>/.env` создан, права 600
      `ls -l /opt/<PROJECT>/.env` → `-rw-------`
- [ ] Секретов нет на сервере вне `.env`
      `ls /opt/<PROJECT>/*.txt 2>/dev/null` → пусто
- [ ] `docker compose up -d --build` отработал без ошибок
- [ ] Контейнеры живы: `docker compose ps` → все `Up`

## Проверка снаружи (с локальной машины, не с сервера)

- [ ] Главная отвечает 200
      ```bash
      curl -s -o /dev/null -w "%{http_code}\n" https://<DOMAIN>/
      ```
- [ ] HTTP редиректит на HTTPS (308/301)
      ```bash
      curl -sI http://<DOMAIN>/ | grep -iE "^HTTP|location"
      ```
- [ ] `www` редиректит на апекс
      ```bash
      curl -sI https://www.<DOMAIN>/ | grep -iE "^HTTP|location"
      ```
- [ ] Сертификат валиден и от Let's Encrypt
      ```bash
      echo | openssl s_client -connect <DOMAIN>:443 -servername <DOMAIN> 2>/dev/null \
        | openssl x509 -noout -subject -issuer -dates
      ```
- [ ] Ключевые страницы отвечают 200 (перечислить свои)
- [ ] Картинки и статика отдаются (не 500 — см. правило про права)
      ```bash
      curl -s -o /dev/null -w "%{http_code}\n" https://<DOMAIN>/images/<любая>.jpg
      ```

## Если есть формы / интеграции

- [ ] Переменные видны в контейнере
      ```bash
      docker compose exec app sh -c 'echo ${TOKEN_NAME:+set}'
      ```
- [ ] Отправка формы возвращает успех и **доходит до получателя**
      (проверить реальной тестовой заявкой, не только кодом ответа)
- [ ] Валидация: пустая форма отклоняется (422/400)
- [ ] Внешние API доступны из контейнера
      ```bash
      docker compose exec app sh -c 'wget -qO- https://api.telegram.org 2>&1 | head -c 100'
      ```

## SEO и превью ссылок

- [ ] `<title>` и `meta description` заполнены
- [ ] Open Graph теги отдаются
      ```bash
      curl -s https://<DOMAIN>/ | grep -oE '<meta property="og:[^>]*>'
      ```
- [ ] Картинка превью открывается (200)
- [ ] Favicon отдаётся
- [ ] Telegram кэширует превью: после правок сбросить через **@WebpageBot**,
      иначе будет висеть старая (или пустая) карточка

## После запуска

- [ ] Автозапуск: контейнеры `unless-stopped`, docker `enabled`
      ```bash
      systemctl is-enabled docker
      ```
- [ ] Проверить перезагрузкой (если можно позволить простой):
      `reboot`, через минуту — сайт снова 200 и VPN активен
- [ ] Записать в передачу клиенту: домен, где лежит проект, как обновлять

## Быстрая проверка одной командой

```bash
D=<DOMAIN>; for p in / /privacy /terms; do
  printf "%-12s " "$p"; curl -s -o /dev/null -w "%{http_code}\n" --max-time 10 "https://$D$p"
done
```
