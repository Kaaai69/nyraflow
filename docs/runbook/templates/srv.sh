#!/bin/sh
# Одна переиспользуемая ssh-сессия к серверу проекта.
#
# Зачем: соединение до сервера бывает нестабильным, а каждая новая команда —
# это новый TCP+TLS хендшейк. ControlMaster держит один канал и мультиплексирует
# в него все последующие вызовы: команды выполняются мгновенно и не отваливаются
# по таймауту на этапе подключения.
#
# Использование:
#   ./srv.sh 'docker compose ps'
#   ./srv.sh 'cd /opt/PROJECT && docker compose logs -f app'
#
# Подставьте свой адрес сервера в SERVER ниже.

SERVER=root@203.0.113.10

# Путь к сокету должен быть КОРОТКИМ: лимит имени unix-сокета — 104 символа,
# длинные пути во временных каталогах его легко превышают.
SOCKET=/tmp/ssh-ctl-project.sock

exec ssh -n -o BatchMode=yes \
  -o ControlMaster=auto -o ControlPath="$SOCKET" -o ControlPersist=30m \
  -o ConnectTimeout=25 -o ConnectionAttempts=3 \
  -o ServerAliveInterval=15 -o ServerAliveCountMax=8 \
  "$SERVER" "$@"
