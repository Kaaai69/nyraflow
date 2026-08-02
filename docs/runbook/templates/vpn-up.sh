#!/usr/bin/env bash
# Порядок важен: сначала awg-quick, потом исключения.
# awg-quick ставит свои ip-правила на 1-2 ниже самого низкого пользовательского,
# поэтому наше правило (pref 50) должно добавляться ПОСЛЕ подъёма туннеля.
set -e
export WG_QUICK_USERSPACE_IMPLEMENTATION=amneziawg-go
if ! ip link show awg0 >/dev/null 2>&1; then
  awg-quick up awg0
fi
/usr/local/sbin/vpn-exempt.sh up
