# CODEXSUN Production Docker Setup Notes

Last reviewed: 2026-07-14.

This note records the current production setup path for this repository. The active deployment bundle is in `.container/` and is the source of truth for Docker builds, container startup, clean reinstall, and upgrades.

## Current Application Shape

CODEXSUN is an npm workspace monorepo using Node.js 22, npm 11, TypeScript, Fastify APIs, React/Vite web apps, MariaDB, Redis/BullMQ queues, and shared file storage.

Runtime services currently packaged by the Docker deployment:

- `platform-api` on port `7010`
- `platform-web` on port `7020`
- `core-api` on port `7030`
- `core-web` on port `7040`
- `billing-api` on port `7050`
- `billing-web` on port `7060`
- `files` File Browser service on port `7090`
- optional internal `mariadb`
- optional internal `redis`
- optional admin tools: Portainer, Adminer, and Redis Commander

The Docker setup reuses one built application image, selected at runtime with `CODEXSUN_SERVICE`.

## What The Docker Image Installs

The production image is built from `.container/Dockerfile`.

Base image:

```text
node:22-bookworm-slim
```

System packages installed in both build and runtime stages:

```text
ca-certificates
curl
git
mariadb-client
nano
redis-tools
sudo
```

Node dependencies are installed with:

```bash
npm ci
```

Application build command:

```bash
npm run build
```

The build output is collected under the root `dist/` tree by the root build script.

## Production Environment File

Create the deployment environment file from the template:

```bash
cp .container/deploy.env.example .container/deploy.env
```

Before exposing the app publicly, edit `.container/deploy.env` and set production values:

- `JWT_SECRET`
- `DB_PASSWORD`
- `MARIADB_ROOT_PASSWORD` when using internal MariaDB
- `FILE_SERVER_PASSWORD`
- public web origins: `PLATFORM_WEB_ORIGIN`, `CORE_WEB_ORIGIN`, `BILLING_WEB_ORIGIN`
- public API URLs: `VITE_PLATFORM_API_URL`, `VITE_CORE_API_URL`, `VITE_BILLING_API_URL`
- `TENANT_DOMAIN_BASE`
- seed users only when intentionally needed: `SUPER_ADMIN_*`, `SOFTWARE_ADMIN_*`, `TENANT_ADMIN_*`

Keep destructive database reset flags disabled in production:

```env
CODEXSUN_DB_FRESH_ON_START=0
CODEXSUN_DB_RESET_CONFIRM=
CODEXSUN_ALLOW_PRODUCTION_DB_RESET=0
ENABLE_DEFAULT_TENANT_SEED=0
```

The setup scripts generate placeholder secrets if missing, but production deployments should still be reviewed manually.

## First Production Deploy

From the repository root:

```bash
cp .container/deploy.env.example .container/deploy.env
bash .container/setup.sh
```

The setup script asks for:

- deploy method: `upgrade` or `reinstall`
- MariaDB mode: `internal` or `external`
- Redis mode: `internal` or `external`

For a single low-cost VPS, the normal first setup is:

```text
upgrade
internal
internal
```

For managed services, choose external MariaDB and/or external Redis, then set the external host, port, credentials, and Redis URL in `.container/deploy.env`.

## Normal Upgrade

Use this for routine production releases. It checks root dependencies, builds the Docker image, starts/replaces containers, runs Platform migrations, and restarts API containers.

```bash
bash .container/upgrade-containers.sh
```

To rebuild/restart containers without running the explicit migration command:

```bash
RUN_PLATFORM_MIGRATIONS=0 bash .container/upgrade-containers.sh
```

## Clean Docker Reinstall

Use this only when the Docker app stack and app/file/Redis volumes must be rebuilt cleanly.

```bash
bash .container/hard-reinstall.sh
```

The script requires typing:

```text
REINSTALL
```

By default, the internal MariaDB volume is preserved. To intentionally wipe the internal database volume too:

```bash
WIPE_INTERNAL_DB=1 bash .container/hard-reinstall.sh
```

Do not use `WIPE_INTERNAL_DB=1` on production unless a verified backup and restore plan is already approved.

## Database Setup Notes

Internal MariaDB:

```bash
bash .container/setup-database.sh internal
```

External MariaDB:

```bash
bash .container/setup-database.sh external
```

External MariaDB values belong in `.container/deploy.env`:

```env
CODEXSUN_DB_MODE=external
DB_HOST=10.0.0.10
DB_PORT=3306
DB_USER=codexsun
DB_PASSWORD=...
DB_MASTER_NAME=codexsun_master
```

Application database stack commands from the repo root:

```bash
npm run db:migrations:preflight
npm run db:migrations:run
npm run db:seed
```

The root database stack routes Platform database work first, then bootstraps registered tenant databases for Core and Billing.

## Redis And Queue Notes

Production Docker defaults to BullMQ backed by Redis:

```env
CODEXSUN_QUEUE_BACKEND=bullmq
CODEXSUN_REDIS_URL=redis://redis:6379
```

Internal Redis:

```bash
bash .container/setup-redis.sh internal
```

External Redis:

```bash
bash .container/setup-redis.sh external
```

For external Redis, set:

```env
CODEXSUN_REDIS_MODE=external
CODEXSUN_REDIS_URL=redis://:password@10.0.0.11:6379/0
REDIS_ADMIN_HOSTS=external:10.0.0.11:6379
```

## File Storage

The deployment creates a shared Docker volume named `codexsun-storage` by default. App containers mount it at `/storage`; File Browser serves the same volume.

Storage-related defaults:

```env
CODEXSUN_BACKUP_DIR=/storage/backups/database
STORAGE_ROOT=/storage/app
STORAGE_PUBLIC_ROOT=/storage/public
```

Start or inspect the file service:

```bash
bash .container/setup-files.sh
```

Keep File Browser private in production with VPN, firewall allowlist, SSH tunnel, or reverse-proxy authentication.

## Admin Tools

Optional admin services are behind the Compose `admin` profile:

- Portainer on port `7091`
- Adminer on port `7092`
- Redis Commander on port `7093`

Start them with:

```bash
bash .container/setup-admin.sh
```

or include them during an upgrade:

```bash
CODEXSUN_ADMIN_TOOLS=1 bash .container/upgrade-containers.sh
```

These ports must not be publicly exposed.

## Logs And Status

Show a service log stream:

```bash
bash .container/logs.sh platform-api
```

Show Compose status:

```bash
docker compose --env-file .container/deploy.env -f .container/docker-compose.yml ps
```

Open an app shell:

```bash
docker compose --env-file .container/deploy.env -f .container/docker-compose.yml run --rm -e CODEXSUN_SERVICE=shell platform-api
```

## Reverse Proxy Notes

Put Nginx or Caddy in front of the host ports for HTTPS.

Recommended public routing:

- Platform web -> `127.0.0.1:7020`
- Platform API -> `127.0.0.1:7010`
- Billing web -> `127.0.0.1:7060`
- Billing API -> `127.0.0.1:7050`

Recommended private/admin-only routing:

- File Browser -> `127.0.0.1:7090`
- Portainer -> `127.0.0.1:7091`
- Adminer -> `127.0.0.1:7092`
- Redis Commander -> `127.0.0.1:7093`

## Pre-Production Checklist

Run these checks from the repository root before building or deploying:

```bash
npm run dependencies:check
npm run check:module-boundaries
npm run typecheck
npm run lint
npm run build
```

For database changes, also run the relevant migration preflight before production deployment:

```bash
npm run db:migrations:preflight
```

Before any production migration or destructive reinstall, create and verify a backup. Keep the verified backup ID with the release notes.

## Important Cautions

- Install dependencies only from the repository root.
- Do not keep workspace-local `node_modules` folders.
- Do not expose admin ports directly to the internet.
- Do not enable `CODEXSUN_DB_FRESH_ON_START=1` in production.
- Do not set `CODEXSUN_ALLOW_PRODUCTION_DB_RESET=1` unless intentionally performing a documented production reset.
- Do not wipe the internal MariaDB Docker volume without a verified backup and explicit approval.
