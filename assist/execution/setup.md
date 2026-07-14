# CODEXSUN Production Docker Setup Notes

Last reviewed: 2026-07-14.

The production source of truth is `.container/`. Deployment is split by bounded runtime instead of reusing one large application image.

## Deployment model

The current independently deployable stacks are:

- MariaDB
- Redis
- Pictures and Files storage
- Platform API/Web and the migration runner
- Core API/Web
- Billing API/Web
- Kitchen Serve API/Web

Each stack owns its Dockerfile(s), Compose file, image tag, health checks, and persistent volume declarations. All stacks join the external `codexsun-network`, allowing a stack to be upgraded without recreating unrelated services.

Application images use the current workspace version `1.0.32`. MariaDB, Redis, Nginx, and File Browser base images use explicit version tags, never `latest`. The exact image matrix is maintained in `.container/README.md` and `.container/deploy.env.example`.

## Production environment

```bash
cp .container/deploy.env.example .container/deploy.env
```

Before deployment, review:

- database, JWT, Pictures, and Files credentials;
- public web origins and Vite API URLs;
- image registry and immutable release tags;
- `CODEXSUN_BIND_ADDRESS` (keep `127.0.0.1` behind a local reverse proxy);
- stable volume names;
- optional Billing GSP credentials.

Keep these production reset controls disabled:

```env
CODEXSUN_DB_FRESH_ON_START=0
CODEXSUN_ALLOW_PRODUCTION_DB_RESET=0
```

Vite API URLs are compiled into web images. Changing a `VITE_*` URL requires rebuilding the corresponding web image.

## Complete deployment

```bash
bash .container/setup.sh
```

Normal upgrades use:

```bash
bash .container/upgrade-containers.sh
```

The upgrade validates Compose, builds every versioned image, waits for healthy services, runs the dedicated Platform migration image, restarts APIs, and waits for health again. Set `RUN_PLATFORM_MIGRATIONS=0` only when migrations are intentionally managed in another release step.

## Individual deployment

```bash
bash .container/stack.sh mariadb up
bash .container/stack.sh redis up
bash .container/stack.sh storage up
bash .container/stack.sh platform up
bash .container/stack.sh core up
bash .container/stack.sh billing up
bash .container/stack.sh kitchen-serve up
```

Deploy dependencies in that order for a new host. Existing stacks may be upgraded separately because their stable network and volumes are external to each Compose project lifecycle.

## Storage and backups

MariaDB data and backups, Redis persistence, each application data directory, picture content/metadata, and file content/metadata use separate named volumes. Normal upgrades and reinstalls preserve all volumes.

Pictures and Files content volumes are shared with API containers at `/storage/pictures` and `/storage/files`. Their File Browser metadata volumes are isolated from application code.

Run `bash .container/setup-media.sh` to initialize or refresh both File Browser administrators. The helper reads `SUPER_ADMIN_PASSWORD` from the repository `.env` and applies it to both storage admin accounts without logging the credential. `--reinstall` recreates metadata while preserving content; `--wipe-media` is an additional destructive option.

The hard reinstall supports explicit independent wipe flags documented in `.container/README.md`. `WIPE_INTERNAL_DB=1` and `WIPE_STORAGE_DATA=1` are destructive and require a verified backup plus approval.

## Future growth rule

New deployable apps should follow the existing folder pattern:

```text
.container/<app>/Dockerfile.api
.container/<app>/Dockerfile.web
.container/<app>/docker-compose.yml
```

Give every new image an immutable workspace-version tag, give every state owner a unique named volume, join `codexsun-network`, add health checks, and then include the stack from `.container/docker-compose.yml`.
