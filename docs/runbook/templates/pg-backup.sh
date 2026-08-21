#!/bin/sh
# Бэкап Postgres из docker-compose проекта.
#
# Ставится в cron на хосте. Делает сжатый дамп, чистит старые и — главное —
# проверяет, что дамп не пустой: молча испортившийся бэкап хуже отсутствующего.
#
# Установка:
#   cp pg-backup.sh /usr/local/sbin/pg-backup.sh && chmod +x /usr/local/sbin/pg-backup.sh
#   crontab -e
#   17 4 * * * /usr/local/sbin/pg-backup.sh >> /var/log/pg-backup.log 2>&1

set -eu

PROJECT_DIR=/opt/myland
BACKUP_DIR=/opt/backups/postgres
SERVICE=db
KEEP_DAYS=14
MIN_SIZE_BYTES=2000

DB_NAME=$(grep '^POSTGRES_DB=' "$PROJECT_DIR/.env" | cut -d= -f2)
DB_USER=$(grep '^POSTGRES_USER=' "$PROJECT_DIR/.env" | cut -d= -f2)
: "${DB_NAME:=nyraflow}"
: "${DB_USER:=nyraflow}"

STAMP=$(date +%Y%m%d-%H%M%S)
TARGET="$BACKUP_DIR/$DB_NAME-$STAMP.sql.gz"

mkdir -p "$BACKUP_DIR"
cd "$PROJECT_DIR"

echo "[$(date -Is)] дамп $DB_NAME → $TARGET"

# --clean --if-exists: дамп можно накатить на непустую базу без ручной чистки.
docker compose exec -T "$SERVICE" \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists \
  | gzip -9 > "$TARGET.tmp"

SIZE=$(stat -c %s "$TARGET.tmp" 2>/dev/null || echo 0)
if [ "$SIZE" -lt "$MIN_SIZE_BYTES" ]; then
  rm -f "$TARGET.tmp"
  echo "[$(date -Is)] ОШИБКА: дамп подозрительно мал ($SIZE байт), бэкап не сохранён"
  exit 1
fi

# Проверяем, что gzip целый и внутри действительно SQL.
if ! gzip -t "$TARGET.tmp" 2>/dev/null; then
  rm -f "$TARGET.tmp"
  echo "[$(date -Is)] ОШИБКА: архив повреждён"
  exit 1
fi

if ! gzip -dc "$TARGET.tmp" | head -40 | grep -q "PostgreSQL database dump"; then
  rm -f "$TARGET.tmp"
  echo "[$(date -Is)] ОШИБКА: в архиве не дамп Postgres"
  exit 1
fi

mv "$TARGET.tmp" "$TARGET"
chmod 600 "$TARGET"
echo "[$(date -Is)] готово, $SIZE байт"

DELETED=$(find "$BACKUP_DIR" -name "$DB_NAME-*.sql.gz" -mtime "+$KEEP_DAYS" -print -delete | wc -l)
[ "$DELETED" -gt 0 ] && echo "[$(date -Is)] удалено старых бэкапов: $DELETED"

echo "[$(date -Is)] всего бэкапов: $(find "$BACKUP_DIR" -name "$DB_NAME-*.sql.gz" | wc -l)"
