# CODEXSUN Billing Deployment

This bundle deploys exactly four independent stacks on one external Docker network:

1. MariaDB
2. Redis
3. Media
4. Billing

The Billing stack contains the shared Framework plus Platform, Core, and Billing API/Web applications. Kitchen Serve and Data Bridge are not built or deployed. A tiny compile-time Data Bridge stub only preserves the current Platform workspace import until that optional route is removed from Platform itself.

## Layout

```text
.container/
  database/mariadb/   MariaDB image, configuration, grants, Compose
  database/redis/     Redis image and Compose
  media/              File Browser image and Compose
  billing/            shared API/Web images and Billing Compose
  deploy.env.example  safe template
  deploy.env          ignored deployment input generated locally/on server
  prepare-env.sh      imports or generates secrets
  setup-media.sh      initializes the media administrator
  setup.sh            installs/reinstalls the complete four-stack deployment
  deploy.sh           deploys or reinstalls only the Billing application stack
```

Every stack joins `codexsun-network`. Persistent data uses stable named volumes and is preserved by normal `down` and upgrade operations.

## Deployment input and secrets

Create or refresh the private input file:

```bash
bash .container/prepare-env.sh
```

For each supported credential, preparation uses this priority:

1. Existing non-placeholder value in `.container/deploy.env`.
2. Matching value from the repository `.env`.
3. A random 32-byte hexadecimal secret.

The generated `.container/deploy.env` is ignored by Git and restricted to the current user where the host supports POSIX permissions. Review it before deployment to set public origins, API URLs, registry names, and optional GSP credentials.

Generated values include MariaDB root, Redis, database, JWT, and media credentials. `MEDIA_ADMIN_PASSWORD` is always synchronized with the resolved `SUPER_ADMIN_PASSWORD` when the latter exists. Secret values are never printed.

When `ENABLE_DEFAULT_TENANT_SEED=1`, preparation validates the full `DEFAULT_TENANT_*` configuration before any Billing teardown. Missing identity defaults are prepared for a CODEXSUN tenant, and missing tenant-admin identity values reuse the configured Super Admin. The values are passed only to the Billing API containers. Complete setup also reconciles the MariaDB application grant required to create configured tenant databases on both new and existing database volumes.

Before a production Billing migration, set `CODEXSUN_VERIFIED_BACKUP_ID` to the verified backup run ID. For a confirmed empty first deployment, record that verification explicitly with a value such as `initial-empty-database-YYYYMMDD`; never reuse that marker for an existing database.

## Images

Application images use workspace version `1.0.33` and are refreshed automatically from `package.json` by `prepare-env.sh`:

- `codexsun/billing-stack-api:1.0.33`
- `codexsun/billing-stack-web:1.0.33`
- `codexsun/billing-stack-migrations:1.0.33`
- `codexsun/mariadb:11.8-codexsun-1.0.33`
- `codexsun/redis:7.4-codexsun-1.0.33`
- `codexsun/media:1.0.33-filebrowser2.63.5`

The shared API image runs Platform, Core, or Billing according to `CODEXSUN_RUNTIME`. The shared web image contains only the Platform, Core, and Billing production bundles and selects one with `CODEXSUN_WEB_APP`.

## First deployment

Confirm the database is empty or take and verify a backup, then record its identifier in `.container/deploy.env` as described above.

Install the complete deployment in dependency order:

```bash
bash .container/setup.sh
```

Cleanly reinstall every container and image while preserving MariaDB, Redis, Media, and Billing named volumes:

```bash
bash .container/setup.sh --reinstall
```

`setup.sh --reinstall` never passes `--volumes`, removes a Docker volume, or calls a database reset/drop command.

Billing deployment builds the shared images, runs the explicit Platform -> Core -> Billing forward-migration stack, prints the applied migration ledger, then starts all six app containers and waits for health checks. Future Accounts modules under Core/Billing automatically enter this build and migration boundary.

Cleanly reinstall only Billing backend/frontend containers and images:

```bash
bash .container/deploy.sh billing --reinstall
```

This Billing command verifies MariaDB and Redis health but never starts, stops, recreates, or removes MariaDB, Redis, or Media. Existing databases, uploads, and Billing storage remain mounted and unchanged except for required forward migrations.

## Other commands

```bash
bash .container/deploy.sh billing build
bash .container/deploy.sh billing migrate
bash .container/deploy.sh billing ps
bash .container/deploy.sh billing logs
bash .container/deploy.sh billing down
```

Normal `down` never removes volumes.

## Media administration

Complete setup calls:

```bash
bash .container/setup-media.sh
```

The helper updates or creates the File Browser `admin` user from `MEDIA_ADMIN_PASSWORD`. The long-running media container does not contain the password in its command arguments.

Recreate only File Browser metadata while preserving uploads:

```bash
bash .container/setup-media.sh --reinstall
```

Wipe metadata and uploaded media only with both flags:

```bash
bash .container/setup-media.sh --reinstall --wipe-media
```

The wipe refuses to continue while another container mounts the media volume and verifies every requested volume removal.

## Default private ports

| Stack/service | Port |
| --- | ---: |
| MariaDB | `3306` |
| Redis | `6379` |
| Media | `7090` |
| Platform API/Web | `7010` / `7020` |
| Core API/Web | `7030` / `7040` |
| Billing API/Web | `7050` / `7060` |

Ports bind to `127.0.0.1` by default. Put Nginx or Caddy on the same host and keep MariaDB, Redis, and Media private.
