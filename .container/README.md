# CODEXSUN Independent Docker Stacks

The Docker deployment follows the app boundaries in `assist/README.md`. Every server has its own image and Compose file, every data owner has a stable named volume, and all stacks communicate through one external Docker network.

## Image policy

CODEXSUN application images use the lockstep workspace version `1.0.32`. Upstream images are pinned; this deployment never uses `latest`.

| Runtime               | Default image                                                            |
| --------------------- | ------------------------------------------------------------------------ |
| Platform API/Web      | `codexsun/platform-api:1.0.32`, `codexsun/platform-web:1.0.32`           |
| Core API/Web          | `codexsun/core-api:1.0.32`, `codexsun/core-web:1.0.32`                   |
| Billing API/Web       | `codexsun/billing-api:1.0.32`, `codexsun/billing-web:1.0.32`             |
| Kitchen Serve API/Web | `codexsun/kitchen-serve-api:1.0.32`, `codexsun/kitchen-serve-web:1.0.32` |
| Migration runner      | `codexsun/platform-migrations:1.0.32`                                    |
| MariaDB               | `codexsun/mariadb:11.8-codexsun-1.0.32`, based on `mariadb:11.8`         |
| Redis                 | `codexsun/redis:7.4-codexsun-1.0.32`, based on `redis:7.4-alpine`        |
| Pictures/Files        | versioned CODEXSUN images based on `filebrowser/filebrowser:v2.63.5`     |

Override `CODEXSUN_IMAGE_REGISTRY` when images will be pushed to GHCR or another registry. Change image tags only through the deployment environment and keep them immutable after publishing.

## Stack layout

```text
.container/
  database/mariadb/       MariaDB Dockerfile, configuration, Compose
  database/redis/         Redis Dockerfile and Compose
  storage/                independent Pictures and Files images/volumes
  platform/               Platform API, web, and migration runner
  core/                   Core API and web
  billing/                Billing API and web
  kitchen-serve/          Kitchen Serve API and web
  docker-compose.yml      full-stack aggregator
  deploy.env.example      shared deployment contract
  stack.sh                individual-stack CLI
```

The external network defaults to `codexsun-network`. The setup scripts create it when missing. Because it is external, stopping one Compose project does not remove connectivity required by another stack.

## Persistent volumes

MariaDB data/backups, Redis data, each app's operational storage, picture content/database, and file content/database all use separate explicitly named volumes. A normal `down`, upgrade, or reinstall does not remove them.

The Pictures and Files content volumes are external shared resources: each API mounts them at `/storage/pictures` and `/storage/files`, while the two File Browser images provide private management surfaces. Their metadata databases remain separate and are never mounted into application containers.

Important data volumes:

- `codexsun-mariadb-data` and `codexsun-mariadb-backups`
- `codexsun-redis-data`
- `codexsun-platform-data`, `codexsun-core-data`, `codexsun-billing-data`, `codexsun-kitchen-serve-data`
- `codexsun-pictures-data`, `codexsun-pictures-db`
- `codexsun-files-data`, `codexsun-files-db`

## First deployment

```bash
cp .container/deploy.env.example .container/deploy.env
nano .container/deploy.env
bash .container/setup.sh
```

Set real public origins/API URLs and review every generated secret before exposing the host. Ports bind to `127.0.0.1` by default for a same-host Nginx/Caddy reverse proxy.

Deploy the complete stack non-interactively:

```bash
bash .container/upgrade-containers.sh
```

This builds versioned images, waits for health checks, runs the Platform/Core/Billing tenant migration stack, restarts APIs, and verifies health again.

## Individual stacks

Each stack can be installed, upgraded, inspected, or stopped independently:

```bash
bash .container/stack.sh mariadb up
bash .container/stack.sh redis up
bash .container/stack.sh storage up
bash .container/stack.sh platform up
bash .container/stack.sh core up
bash .container/stack.sh billing up
bash .container/stack.sh kitchen-serve up
```

Supported actions are `up`, `build`, `pull`, `ps`, `logs`, and `down`. Direct Compose usage is also supported:

```bash
docker compose --env-file .container/deploy.env \
  -f .container/billing/docker-compose.yml up -d --build --wait
```

Start infrastructure before app stacks when deploying them separately. Core expects Platform on the shared network; Billing expects Core; all APIs expect MariaDB, and Platform queue processing expects Redis.

## Pictures and Files administrator

Use the media setup helper when installing storage or refreshing its administrator:

```bash
bash .container/setup-media.sh
```

It reads `SUPER_ADMIN_PASSWORD` from the repository `.env`, synchronizes the Pictures and Files deployment credentials, initializes both File Browser databases, and updates or creates each `admin` user with full management permissions. The password is never printed.

Recreate only the File Browser metadata databases while preserving uploaded content:

```bash
bash .container/setup-media.sh --reinstall
```

`--reinstall --wipe-media` also removes picture and file content and is intentionally blocked while API containers have those volumes mounted.

## Ports

| Service                 |       Host port |
| ----------------------- | --------------: |
| Platform API / Web      | `7010` / `7020` |
| Core API / Web          | `7030` / `7040` |
| Billing API / Web       | `7050` / `7060` |
| Files / Pictures        | `7090` / `7094` |
| Kitchen Serve API / Web | `7110` / `7120` |
| MariaDB / Redis         | `3306` / `6379` |

Keep database, Redis, pictures, and files private. Change `CODEXSUN_BIND_ADDRESS` only for a deliberate trusted-network deployment.

## Reinstall and data safety

```bash
bash .container/hard-reinstall.sh
```

The command requires typing `REINSTALL`. It recreates containers and images but preserves every volume by default. Destructive flags are independent:

- `WIPE_APP_DATA=1`
- `WIPE_STORAGE_DATA=1`
- `WIPE_REDIS_DATA=1`
- `WIPE_INTERNAL_DB=1`

Never wipe MariaDB or storage volumes without a verified backup and explicit approval.

If Redis authentication is enabled, set both `REDIS_PASSWORD` and an encoded authenticated `CODEXSUN_REDIS_URL` in `deploy.env`.
