# MyLand — Deployment

> Этот файл описывает **конкретно этот проект**. Переиспользуемые инструкции по
> развёртыванию любых лендингов (сервер, Docker, VPN, чек-листы, шаблоны файлов)
> — в [docs/runbook/](docs/runbook/README.md).

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

The same `.env` also feeds the mini app and Postgres containers — see
[miniapp/.env.example](miniapp/.env.example) for the full list.

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

## Telegram Mini App (nyraflow desk)

`miniapp/` is a second Next.js app served at **https://app.nyraflow.ru** from
its own container, with Postgres alongside it. It shares this repo, this
`docker-compose.yml`, this Caddy instance and `/opt/myland/.env` — but nothing
in the landing depends on it, and a broken mini app cannot take the site down.

Before the first deploy:

1. `A` record `app.nyraflow.ru` → server IP.
2. Add `POSTGRES_PASSWORD`, `DATABASE_URL` and `TELEGRAM_ADMIN_IDS` to
   `/opt/myland/.env` (`docker compose` refuses to start without the password).
3. In BotFather, point the existing bot's menu button at `https://app.nyraflow.ru`.

Deploy is the same rsync + `docker compose up -d --build`. Schema migrations run
automatically in the mini app container before the server starts; if a migration
fails the container stays down instead of serving an unknown schema.

```bash
curl -s https://app.nyraflow.ru/api/health     # {"ok":true,"db":"up",...}
docker compose logs -f miniapp                 # app + migration logs
docker compose exec db psql -U nyraflow -d nyraflow   # psql into the database
```

Details and architecture: [miniapp/README.md](miniapp/README.md).

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
domain, edit `Caddyfile`, copy it to `/opt/myland/Caddyfile`, then **recreate**
the container:

```bash
docker compose up -d --force-recreate caddy
```

`--force-recreate` is not optional here. The Caddyfile is bind-mounted as a
single file, so the container holds its **inode** — and `rsync` (like most
editors) writes a new file and renames it over the old one. After a deploy the
container is therefore still reading the previous version: `caddy reload` and
`docker compose restart caddy` both report success and change nothing, and
`caddy validate` inside the container validates the stale file. Only recreating
the container re-resolves the mount.
