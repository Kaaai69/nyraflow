# MyLand — Deployment

Self-hosted deployment: the Next.js app runs in Docker behind Caddy (automatic
HTTPS), on a server whose entire outbound traffic is tunnelled through an
AmneziaWG VPN.

Live: **https://nyraflow.ru**

## Requirements

**Server**
- Linux (tested on Ubuntu 26.04), root/sudo access.
- Docker Engine + Docker Compose plugin (installed manually from Docker's
  official apt repository).
- Ports **80** and **443** reachable from the internet (HTTP→HTTPS redirect and
  Let's Encrypt live here).
- ~1 GB RAM free for the build, ~2 GB disk.

**DNS**
- `A` record `nyraflow.ru` → server IP.
- `A` record `www.nyraflow.ru` → server IP (redirects to the apex).

**Build/runtime**
- Node is not needed on the host — it only exists inside the build image.
- `next.config.ts` must set `output: "standalone"` (already committed) so the
  runtime image stays small.

## Secrets (never committed / never on the server)

These files live only on the developer machine and are git-ignored:

| File           | Purpose                                             |
|----------------|-----------------------------------------------------|
| `server.txt`   | SSH host + password for the server.                 |
| `vpn.conf`     | AmneziaWG client config (the VPN the server egress uses). |
| `telegram.txt` | Telegram bot token / chat id (not referenced by the app code yet). |

### Runtime environment variables

The contact form delivers submissions to Telegram, so the **app** container
needs these (kept in `/opt/myland/.env` on the server — git-ignored, not baked
into the image; `docker-compose.yml` loads them via `env_file`):

| Variable             | Purpose                                  |
|----------------------|------------------------------------------|
| `TELEGRAM_BOT_TOKEN` | Bot token (BotFather).                   |
| `TELEGRAM_CHAT_ID`   | Chat id that receives the applications.  |

```bash
# /opt/myland/.env
TELEGRAM_BOT_TOKEN=123456:AA...
TELEGRAM_CHAT_ID=1098997456
```

The recipient must have pressed **/start** on the bot at least once, otherwise
Telegram refuses the message. Outbound requests to `api.telegram.org` go through
the server's VPN egress (which is how they reach Telegram from Russia).

## First deploy

```bash
# 1. copy the project to the server (excluding node_modules/.next/.git/secrets)
rsync -a --exclude node_modules --exclude .next --exclude .git \
      --exclude 'server.txt' --exclude 'telegram.txt' --exclude 'vpn.conf' \
      ./ root@SERVER:/opt/myland/

# 2. build + start
ssh root@SERVER 'cd /opt/myland && docker compose up -d --build'
```

Caddy obtains the TLS certificate automatically on first start.

## Update (redeploy a new version)

```bash
rsync -a --exclude node_modules --exclude .next --exclude .git ./ root@SERVER:/opt/myland/
ssh root@SERVER 'cd /opt/myland && docker compose up -d --build'
```

## Management

```bash
cd /opt/myland
docker compose ps                 # container status
docker compose logs -f app        # app logs
docker compose logs -f caddy      # caddy / TLS logs
docker compose restart caddy      # reload after editing Caddyfile
docker compose down               # stop everything
```

Both containers use `restart: unless-stopped` and start automatically on boot
(the Docker service is enabled).

## VPN (full-tunnel egress)

All server-originated traffic (host **and** containers) egresses through the
AmneziaWG exit; inbound SSH (22) and web (80/443) still reply over the real
uplink so the box and the site stay reachable on their real IP.

```bash
systemctl status vpn-fulltunnel   # service state
awg show awg0                     # tunnel + handshake
systemctl restart vpn-fulltunnel  # re-establish tunnel
```

Implementation lives in `/usr/local/sbin/vpn-{up,down,exempt}.sh` and
`/etc/systemd/system/vpn-fulltunnel.service` on the server (userspace
`amneziawg-go`, config at `/etc/amnezia/amneziawg/awg0.conf`).

## HTTPS / domains

Domains and automatic HTTPS are configured in `Caddyfile`. To add or change a
domain, edit `Caddyfile`, copy it to `/opt/myland/Caddyfile`, then
`docker compose restart caddy`.
