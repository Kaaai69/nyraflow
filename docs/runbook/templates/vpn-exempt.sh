#!/usr/bin/env bash
# Исключение для входящих соединений при full-tunnel VPN.
#
# Ответы на соединения, инициированные СНАРУЖИ (SSH 22, веб 80/443), уходят
# через реальный аплинк; весь трафик, инициированный сервером, — через туннель.
#
# Установка: /usr/local/sbin/vpn-exempt.sh (chmod 755)
# Вызывается из vpn-up.sh / vpn-down.sh.
set -u

# ---- НАСТРОИТЬ ПОД СЕРВЕР ----
V4GW=<GATEWAY>          # ip route show default
V4DEV=<IFACE>           # внешний интерфейс, обычно eth0
V6GW=                   # IPv6-шлюз (ip -6 route show default), пусто если нет
V6DEV=<IFACE>
PORTS=22,80,443         # 80/443 обязательно, иначе сайт станет недоступен
# ------------------------------

MARK=0x2
TABLE=200
PREF=50                 # ВАЖНО: правило ставится ПОСЛЕ подъёма awg-quick,
                        # иначе окажется ниже его правил и не сработает
TUN=awg0

apply() {
  # loose reverse-path filtering: иначе ядро отбросит асимметричные ответы
  sysctl -qw net.ipv4.conf.all.rp_filter=2 2>/dev/null || true
  sysctl -qw net.ipv4.conf.$V4DEV.rp_filter=2 2>/dev/null || true

  ip -4 route replace default via $V4GW dev $V4DEV table $TABLE
  ip -4 rule del fwmark $MARK table $TABLE 2>/dev/null || true
  ip -4 rule add fwmark $MARK table $TABLE pref $PREF

  # пометить НОВЫЕ входящие соединения на нужных портах
  iptables -t mangle -C PREROUTING -i $V4DEV -p tcp -m multiport --dports $PORTS -m conntrack --ctstate NEW -j CONNMARK --set-mark $MARK 2>/dev/null || \
  iptables -t mangle -I PREROUTING 1 -i $V4DEV -p tcp -m multiport --dports $PORTS -m conntrack --ctstate NEW -j CONNMARK --set-mark $MARK

  # восстановление метки в PREROUTING — ТОЛЬКО для трафика не с внешнего
  # интерфейса (ответы из контейнеров). Иначе ломается DNAT в docker-сеть.
  iptables -t mangle -C PREROUTING ! -i $V4DEV -m connmark --mark $MARK -j CONNMARK --restore-mark 2>/dev/null || \
  iptables -t mangle -A PREROUTING ! -i $V4DEV -m connmark --mark $MARK -j CONNMARK --restore-mark

  # восстановление в OUTPUT — ТОЛЬКО для соединений с нашей меткой, иначе
  # затрётся fwmark самого WireGuard и получится петля маршрутизации
  iptables -t mangle -C OUTPUT -m connmark --mark $MARK -j CONNMARK --restore-mark 2>/dev/null || \
  iptables -t mangle -A OUTPUT -m connmark --mark $MARK -j CONNMARK --restore-mark

  # MTU туннеля меньше обычного — без clamping виснут npm install / docker pull
  iptables -t mangle -C POSTROUTING -o $TUN -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null || \
  iptables -t mangle -A POSTROUTING -o $TUN -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu

  if [ -n "$V6GW" ]; then
    ip -6 route replace default via $V6GW dev $V6DEV table $TABLE 2>/dev/null || true
    ip -6 rule del fwmark $MARK table $TABLE 2>/dev/null || true
    ip -6 rule add fwmark $MARK table $TABLE pref $PREF
    ip6tables -t mangle -C PREROUTING -i $V6DEV -p tcp -m multiport --dports $PORTS -m conntrack --ctstate NEW -j CONNMARK --set-mark $MARK 2>/dev/null || \
    ip6tables -t mangle -I PREROUTING 1 -i $V6DEV -p tcp -m multiport --dports $PORTS -m conntrack --ctstate NEW -j CONNMARK --set-mark $MARK
    ip6tables -t mangle -C PREROUTING ! -i $V6DEV -m connmark --mark $MARK -j CONNMARK --restore-mark 2>/dev/null || \
    ip6tables -t mangle -A PREROUTING ! -i $V6DEV -m connmark --mark $MARK -j CONNMARK --restore-mark
    ip6tables -t mangle -C OUTPUT -m connmark --mark $MARK -j CONNMARK --restore-mark 2>/dev/null || \
    ip6tables -t mangle -A OUTPUT -m connmark --mark $MARK -j CONNMARK --restore-mark
  fi
}

remove() {
  iptables -t mangle -D POSTROUTING -o $TUN -p tcp -m tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu 2>/dev/null || true
  iptables -t mangle -D PREROUTING -i $V4DEV -p tcp -m multiport --dports $PORTS -m conntrack --ctstate NEW -j CONNMARK --set-mark $MARK 2>/dev/null || true
  iptables -t mangle -D PREROUTING ! -i $V4DEV -m connmark --mark $MARK -j CONNMARK --restore-mark 2>/dev/null || true
  iptables -t mangle -D OUTPUT -m connmark --mark $MARK -j CONNMARK --restore-mark 2>/dev/null || true
  ip -4 rule del fwmark $MARK table $TABLE pref $PREF 2>/dev/null || true
  ip -4 route flush table $TABLE 2>/dev/null || true

  ip6tables -t mangle -D PREROUTING -i $V6DEV -p tcp -m multiport --dports $PORTS -m conntrack --ctstate NEW -j CONNMARK --set-mark $MARK 2>/dev/null || true
  ip6tables -t mangle -D PREROUTING ! -i $V6DEV -m connmark --mark $MARK -j CONNMARK --restore-mark 2>/dev/null || true
  ip6tables -t mangle -D OUTPUT -m connmark --mark $MARK -j CONNMARK --restore-mark 2>/dev/null || true
  ip -6 rule del fwmark $MARK table $TABLE pref $PREF 2>/dev/null || true
  ip -6 route flush table $TABLE 2>/dev/null || true
}

case "${1:-}" in
  up) apply;;
  down) remove;;
  *) echo "usage: $0 up|down"; exit 1;;
esac
