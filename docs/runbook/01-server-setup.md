# 01. Подготовка сервера и установка Docker

Выполняется один раз на новом сервере. Дальше на нём можно держать сколько
угодно лендингов.

## Требования

- Ubuntu 22.04+ (проверено на 26.04), root-доступ по SSH
- Порты **80** и **443** открыты снаружи — Caddy на них выпускает сертификаты
- От 1 ГБ свободной RAM на сборку, ~2 ГБ диска на проект

## 1. Собрать данные о сервере

Эти значения понадобятся дальше (особенно для VPN):

```bash
cat /etc/os-release | head -3; uname -r; nproc; free -h | head -2; df -h / | tail -1
ip route show default        # → <GATEWAY> и <IFACE>
ip -brief addr               # → <SERVER_IP>
ip -6 route show default     # IPv6-шлюз, если есть
```

Запишите: `<SERVER_IP>`, `<GATEWAY>`, `<IFACE>`.

## 2. Установить Docker вручную (официальный репозиторий)

Не из `apt install docker.io` — там старая версия без compose-плагина.

```bash
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
```

Определить кодовое имя, которое поддерживает Docker (для свежих Ubuntu своего
репозитория может ещё не быть — берём ближайший рабочий):

```bash
CN=""
for c in $(lsb_release -cs) plucky oracular noble jammy; do
  if curl -fsSL "https://download.docker.com/linux/ubuntu/dists/$c/Release" >/dev/null 2>&1; then CN=$c; break; fi
done
echo "выбран: $CN"
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $CN stable" > /etc/apt/sources.list.d/docker.list
```

Установить и включить автозапуск:

```bash
apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker
```

## 3. Проверить

```bash
docker --version && docker compose version && systemctl is-active docker
```

Ожидается версия Docker Engine и Compose v2+, статус `active`.

## 4. Базовая гигиена

Автоочистка мусора после сборок (образы копятся быстро):

```bash
docker system df                 # сколько занято
docker image prune -f            # удалить висячие образы
```

Полезно раз в неделю; при нехватке места — `docker system prune -af`
(осторожно: удалит все неиспользуемые образы, следующая сборка будет дольше).

## Дальше

→ [02-vpn-full-tunnel.md](02-vpn-full-tunnel.md) — если нужен VPN для исходящего трафика
→ [03-docker-deploy.md](03-docker-deploy.md) — если VPN не нужен, сразу к деплою
