#!/bin/sh
# Деплой мини-аппа — и только его.
#
# ВАЖНО: синхронизируются исключительно каталоги мини-аппа и общая
# инфраструктура. Исходники лендинга (app/, components/, content/, lib/,
# public/) не передаются НИКОГДА.
#
# Причина запрета: лендинг и мини-апп живут в одном репозитории, но правят их
# из разных мест и в разное время. Синхронизация всего каталога перезаписывает
# чужие свежие изменения молча — сайт продолжает работать на старом образе, а
# поломка всплывает при следующей пересборке, когда связь с причиной уже
# потеряна.

set -eu

SERVER=${SERVER:-root@203.0.113.10}
TARGET=${TARGET:-/opt/myland}
SSH_OPTS="-o BatchMode=yes -o ConnectTimeout=20"

echo "→ синхронизирую мини-апп на $SERVER:$TARGET"

# Белый список: перечисляем что передавать, а не что исключать. Список
# исключений забывают дополнить, белый список ошибается в безопасную сторону.
rsync -a --info=stats1 \
  --exclude 'node_modules' --exclude '.next' --exclude '*.tsbuildinfo' \
  -e "ssh $SSH_OPTS" \
  ./miniapp/ "$SERVER:$TARGET/miniapp/"

echo "→ инфраструктура"
rsync -a -e "ssh $SSH_OPTS" ./docker-compose.yml "$SERVER:$TARGET/docker-compose.yml"

echo "→ сборка"
ssh $SSH_OPTS "$SERVER" "cd $TARGET && docker compose up -d --build miniapp outbox"

echo "→ проверка"
ssh $SSH_OPTS "$SERVER" "cd $TARGET && docker compose ps --format 'table {{.Name}}\t{{.Status}}'"
curl -s --max-time 15 https://app.nyraflow.ru/api/health && echo

# Caddyfile передаётся отдельно и осознанно: он общий для всех сайтов, а
# контейнер держит его по inode и требует пересоздания. См. 05-ssh-and-tls-checks.md
