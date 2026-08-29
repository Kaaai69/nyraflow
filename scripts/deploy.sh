#!/usr/bin/env bash
# Раскат лендинга на прод со сверкой сервера и репозитория.
#
# ЗАЧЕМ. Прод-дерево /opt/myland — не git-репозиторий, а деплой это распаковка
# tar поверх него. Правки поэтому живут в трёх местах сразу (сервер, локальное
# дерево, git) и регулярно расходятся: на сервере уже находили Метрику,
# верификации и целую секцию работ, которых не было в репозитории. Раскат
# вслепую такие файлы затирает — счётчик Метрики так однажды уже потеряли.
#
# Скрипт делает сверку обязательной: сначала показывает, чем сервер отличается
# от локального дерева, и без --force не даёт катить, если на сервере есть
# файлы, которых нет у нас.
#
#   scripts/deploy.sh --check      только сверка, ничего не меняет
#   scripts/deploy.sh              сверка → бэкап → раскат → пересборка → smoke
#
# Из WSL сервер недоступен напрямую (VPN поднят на Windows), поэтому ssh/scp
# берём windows-овые, ключ — из профиля Windows.

set -euo pipefail

# Сверка сервера с локальным деревом идёт через sort/comm/join: под другой
# локалью порядок строк разъедется, и join покажет расхождения там, где их нет.
export LC_ALL=C

HOST=${DEPLOY_HOST:-root@217.198.6.154}
KEY=${DEPLOY_KEY:-'C:\Users\guere\.ssh\id_ed25519_nyraflow'}
SSH=${DEPLOY_SSH:-/mnt/c/Windows/System32/OpenSSH/ssh.exe}
SCP=${DEPLOY_SCP:-/mnt/c/Windows/System32/OpenSSH/scp.exe}
WIN_TMP=${DEPLOY_WIN_TMP:-/mnt/c/Users/guere}
WIN_TMP_DOS=${DEPLOY_WIN_TMP_DOS:-'C:\Users\guere'}
# Путь к архиву в том виде, в каком его понимает scp: windows-овому нужен
# DOS-путь с обратными слешами, обычному — то же место в POSIX-виде.
STAGE_DOS=${DEPLOY_STAGE_DOS:-"$WIN_TMP_DOS\\deploy.tgz"}
REMOTE=/opt/myland
SITE=${DEPLOY_SITE:-https://nyraflow.ru}

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

CHECK_ONLY=0
FORCE=0
for arg in "$@"; do
  case "$arg" in
    --check) CHECK_ONLY=1 ;;
    --force) FORCE=1 ;;
    *) echo "неизвестный аргумент: $arg" >&2; exit 2 ;;
  esac
done

remote() { "$SSH" -i "$KEY" -o BatchMode=yes -o ConnectTimeout=25 -o ServerAliveInterval=15 "$HOST" "$@"; }

say() { printf '\n\033[1m== %s\033[0m\n' "$1"; }

# --- 1. Репозиторий должен быть свёрнут с origin -----------------------------
# Локальный main регулярно отстаёт, потому что fetch рвётся, — и тогда работа
# делается поверх устаревшей истории и дублирует уже сделанное.
say "Сверка с origin"
"$ROOT/scripts/git-retry.sh" fetch origin main >/dev/null
BRANCH=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD)
BEHIND=$(git -C "$ROOT" rev-list --count "HEAD..origin/main")
if [ "$BEHIND" -gt 0 ]; then
  echo "✗ HEAD ($BRANCH) отстаёт от origin/main на $BEHIND коммит(ов) — сначала смержите" >&2
  git -C "$ROOT" log --oneline HEAD..origin/main | cat >&2
  [ "$FORCE" -eq 1 ] || exit 1
fi
DIRTY=$(git -C "$ROOT" status --porcelain -- app components content lib public tests Caddyfile package.json | wc -l)
if [ "$DIRTY" -gt 0 ]; then
  echo "⚠ в лендинге есть незакоммиченные правки — они уедут на прод, но не в git:"
  git -C "$ROOT" status --short -- app components content lib public tests Caddyfile package.json
  [ "$FORCE" -eq 1 ] || { echo "✗ закоммитьте их или запустите с --force" >&2; exit 1; }
fi

# --- 2. Что на сервере отличается от нашего дерева ---------------------------
say "Сверка сервера с локальным деревом"
remote "cd $REMOTE && find . -type f \( -path ./node_modules -o -path ./.next -o -path '*/node_modules/*' -o -path '*/.next/*' \) -prune -o -type f -print0 | xargs -0 md5sum | sed 's|  \./|  |' | sort -k2" > "$WORK/server.txt"

(cd "$ROOT" && find . -type f \( -path ./node_modules -o -path ./.next -o -path ./.git -o -path './.git/*' -o -path '*/node_modules/*' -o -path '*/.next/*' \) -prune -o -type f -print0 | xargs -0 md5sum | sed 's|  \./|  |' | sort -k2) > "$WORK/local.txt"

awk '{print $2}' "$WORK/server.txt" | sort > "$WORK/server-names.txt"
awk '{print $2}' "$WORK/local.txt" | sort > "$WORK/local-names.txt"

# .env и его бэкапы живут только на сервере по замыслу — это не дрейф.
comm -23 "$WORK/server-names.txt" "$WORK/local-names.txt" | grep -vE '^\.env' > "$WORK/only-server.txt" || true

if [ -s "$WORK/only-server.txt" ]; then
  echo "⚠ есть только на сервере (раскат их не удалит, но версия в git отстаёт):"
  sed 's/^/    /' "$WORK/only-server.txt"
fi

join -j 2 -o 0,1.1,2.1 "$WORK/server.txt" "$WORK/local.txt" | awk '$2!=$3 {print $1}' > "$WORK/differs.txt" || true
if [ -s "$WORK/differs.txt" ]; then
  echo "· содержимое разошлось (уедет наша версия):"
  sed 's/^/    /' "$WORK/differs.txt"
fi

if [ -s "$WORK/only-server.txt" ] && [ "$FORCE" -eq 0 ]; then
  cat >&2 <<'MSG'

✗ На сервере есть файлы, которых нет в рабочем дереве. Перенесите их к себе и
  закоммитьте, иначе они так и останутся вне репозитория:

    scp.exe -i "$KEY" root@HOST:/opt/myland/ПУТЬ ./ПУТЬ

  Осознанно катить поверх — scripts/deploy.sh --force
MSG
  exit 1
fi

if [ "$CHECK_ONLY" -eq 1 ]; then
  say "Только сверка (--check), раскат не выполнялся"
  exit 0
fi

# --- 3. Бэкап и раскат -------------------------------------------------------
say "Бэкап прод-дерева"
remote "tar czf /root/myland-backup-\$(date +%F-%H%M).tgz -C /opt myland && ls -lh /root/myland-backup-*.tgz | tail -1"

say "Сборка архива"
# miniapp катится своим циклом, .env живёт только на сервере, секреты не кладём.
tar czf "$WORK/deploy.tgz" \
  --exclude=node_modules --exclude=.next --exclude=.git --exclude=miniapp \
  --exclude='.env*' --exclude='*.ogg' --exclude='*.ogg:Zone.Identifier' --exclude='*.mov' \
  --exclude=server.txt --exclude=telegram.txt --exclude=vpn.conf \
  --exclude=demo --exclude=.superpowers \
  -C "$ROOT" .
cp "$WORK/deploy.tgz" "$WIN_TMP/deploy.tgz"

say "Заливка и распаковка"
"$SCP" -i "$KEY" -o BatchMode=yes -o ConnectTimeout=25 "$STAGE_DOS" "$HOST:/root/deploy.tgz"
rm -f "$WIN_TMP/deploy.tgz"
remote "tar tzf /root/deploy.tgz | grep -cE '^\./miniapp/|^\./\.env' | grep -qx 0 || { echo 'в архиве оказались miniapp или .env'; exit 1; }"
remote "tar xzf /root/deploy.tgz -C $REMOTE && test -f $REMOTE/.env && echo '.env на месте' && rm -f /root/deploy.tgz"

say "Пересборка контейнера лендинга"
remote "cd $REMOTE && docker compose up -d --build app 2>&1 | tail -5"

# --- 4. Smoke ---------------------------------------------------------------
say "Проверка живого сайта"
remote "sleep 6; H=\$(curl -sk $SITE/);
  echo \"размер страницы: \${#H}\";
  echo \"Метрика:      \$(echo \"\$H\" | grep -c 'mc.yandex.ru/metrika/tag.js')\";
  echo \"Google verify: \$(echo \"\$H\" | grep -c 'google-site-verification')\";
  for p in / /robots.txt /sitemap.xml /yandex_3e7eebc02fa242e6.html; do
    printf '%-34s %s\n' \"\$p\" \"\$(curl -sk -o /dev/null -w '%{http_code}' $SITE\$p)\";
  done"

say "Готово"
