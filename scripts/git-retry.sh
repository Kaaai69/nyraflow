#!/usr/bin/env bash
# Обёртка над git для операций, ходящих в GitHub.
#
# Провайдер режет исходящий 22, поэтому origin ходит через ssh.github.com:443,
# а тот через VPN отвечает через раз: fetch и push штатно падают по таймауту
# 3-5 раз подряд, прежде чем пройти. Ручные повторы приводят к тому, что
# работаешь поверх устаревшего origin/main — так уже дублировалась чужая
# работа. Скрипт повторяет операцию, пока она не пройдёт.
#
#   scripts/git-retry.sh fetch origin main
#   scripts/git-retry.sh push origin main

set -uo pipefail

ATTEMPTS=${GIT_RETRY_ATTEMPTS:-10}
# Оборванный туннель не отдаёт ошибку, а молча висит: без потолка на попытку
# скрипт залипает на первом же зависшем соединении вместо того, чтобы повторить.
PER_TRY=${GIT_RETRY_TIMEOUT:-40}

if [ $# -eq 0 ]; then
  echo "использование: $0 <аргументы git>, например: $0 push origin main" >&2
  exit 2
fi

out=""
for attempt in $(seq 1 "$ATTEMPTS"); do
  if out=$(timeout "$PER_TRY" git "$@" 2>&1); then
    [ -n "$out" ] && echo "$out"
    echo "✓ git $* — прошло с попытки $attempt"
    exit 0
  fi
  rc=$?
  if [ $rc -eq 124 ]; then
    echo "· попытка $attempt: соединение зависло, оборвали по $PER_TRY с" >&2
  else
    echo "· попытка $attempt: $(echo "$out" | head -1)" >&2
  fi
  sleep 2
done

echo "✗ git $* не прошло за $ATTEMPTS попыток" >&2
echo "$out" >&2
exit 1
