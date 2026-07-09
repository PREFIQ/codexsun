# CODEXSUN Docker Deployment

This deployment is for the current CODEXSUN monorepo described in `assist/README.md`: Framework, Platform, Core, Billing, Accounts, MariaDB, Redis queue support, and file storage. It keeps each runtime in its own container while reusing one built image to keep hosting simple and affordable.

## Affordable Topology

- One small VPS with Docker and Docker Compose.
- One Compose project named `codexsun`.
- Separate containers for `platform-api`, `platform-web`, `core-api`, `core-web`, `billing-api`, `billing-web`, `accounts-api`, `accounts-web`, and `files`.
- Optional internal MariaDB and Redis containers for low-cost single-server deploys.
- Optional external MariaDB and Redis for managed database or existing server reuse.
- Optional admin containers for Docker, MariaDB, and Redis administration.
- One shared Docker volume, `codexsun-storage`, mounted into all app containers and File Browser.

Default ports:

| Service | Host Port |
| --- | ---: |
| Platform API | 7010 |
| Platform Web | 7020 |
| Core API | 7030 |
| Core Web | 7040 |
| Billing API | 7050 |
| Billing Web | 7060 |
| Accounts API | 7070 |
| Accounts Web | 7080 |
| File server | 7090 |
| Docker admin, Portainer | 7091 |
| MariaDB admin, Adminer | 7092 |
| Redis admin, Redis Commander | 7093 |

## First Deploy

```bash
cp .container/deploy.env.example .container/deploy.env
bash .container/setup.sh
```

The interactive setup asks:

- `upgrade` or `reinstall`
- internal or external MariaDB
- internal or external Redis

For production, edit `.container/deploy.env` first and set real passwords, origins, public API URLs, and `JWT_SECRET`. The setup script generates missing placeholder secrets, but public deployments should still be reviewed before DNS/Nginx is pointed at the services.

## Method 1: Container Upgrade

Use this for normal CI/CD and regular releases. It rebuilds the image, starts/replaces containers, runs Platform migrations by default, and preserves volumes.

```bash
bash .container/upgrade-containers.sh
```

Skip the explicit migration run when you only need a container restart:

```bash
RUN_PLATFORM_MIGRATIONS=0 bash .container/upgrade-containers.sh
```

## Method 2: Hard Docker Reinstall

Use this when the Docker app stack must be rebuilt cleanly. It recreates app/file/Redis volumes and containers. The internal MariaDB volume is preserved by default.

```bash
bash .container/hard-reinstall.sh
```

To intentionally wipe the internal MariaDB Docker volume too:

```bash
WIPE_INTERNAL_DB=1 bash .container/hard-reinstall.sh
```

The script asks you to type `REINSTALL` before it removes volumes.

## Individual Setup Scripts

```bash
bash .container/setup-database.sh internal
bash .container/setup-database.sh external
bash .container/setup-redis.sh internal
bash .container/setup-redis.sh external
bash .container/setup-files.sh
bash .container/setup-admin.sh
bash .container/logs.sh platform-api
```

Admin tools are behind the `admin` Compose profile. Enable them with:

```bash
CODEXSUN_ADMIN_TOOLS=1 bash .container/upgrade-containers.sh
```

or start only the admin containers:

```bash
bash .container/setup-admin.sh
```

Keep these ports private in production. Portainer uses the Docker socket, so expose it only through VPN, SSH tunnel, firewall allowlist, or a trusted admin network.

For an external MariaDB deployment, set these values in `.container/deploy.env`:

```env
CODEXSUN_DB_MODE=external
DB_HOST=10.0.0.10
DB_PORT=3306
DB_USER=codexsun
DB_PASSWORD=...
DB_MASTER_NAME=codexsun_master
```

For external Redis:

```env
CODEXSUN_REDIS_MODE=external
CODEXSUN_REDIS_URL=redis://:password@10.0.0.11:6379/0
REDIS_ADMIN_HOSTS=external:10.0.0.11:6379
```

## CI/CD

The cheapest reliable path is GitHub Actions over SSH to the VPS. The workflow in `.github/workflows/deploy.yml` checks, builds, then runs `.container/upgrade-containers.sh` on the server.

Required GitHub secrets:

- `CODEXSUN_DEPLOY_HOST`
- `CODEXSUN_DEPLOY_USER`
- `CODEXSUN_DEPLOY_KEY`
- `CODEXSUN_DEPLOY_PATH`, for example `/opt/codexsun`

Server preparation:

```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin git
sudo usermod -aG docker "$USER"
git clone https://github.com/YOUR_ORG/YOUR_REPO.git /opt/codexsun
cd /opt/codexsun
cp .container/deploy.env.example .container/deploy.env
bash .container/setup.sh
```

After that, pushes to `main` can upgrade containers automatically.

## Nginx Hint

Put Nginx or Caddy in front of the host ports for HTTPS. A simple split is:

- public platform app -> `127.0.0.1:7020`
- platform API -> `127.0.0.1:7010`
- billing app -> `127.0.0.1:7060`
- billing API -> `127.0.0.1:7050`
- accounts app -> `127.0.0.1:7080`
- accounts API -> `127.0.0.1:7070`
- file manager -> private/admin-only access to `127.0.0.1:7090`

Keep File Browser behind VPN, basic auth, or an admin-only firewall rule for production.
