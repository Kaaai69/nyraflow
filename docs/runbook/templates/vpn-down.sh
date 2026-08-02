#!/usr/bin/env bash
export WG_QUICK_USERSPACE_IMPLEMENTATION=amneziawg-go
ip link show awg0 >/dev/null 2>&1 && awg-quick down awg0
/usr/local/sbin/vpn-exempt.sh down
