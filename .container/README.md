# CODEXSUN Container Deployment

This directory provides one persistent infrastructure layer and the independently replaceable Billing product stack.

| Product | Source composition                    | Runtime services                                |
| ------- | ------------------------------------- | ----------------------------------------------- |
| Billing | Framework + Platform + Core + Billing | Platform API/Web, Core API/Web, Billing API/Web |

MariaDB, Redis, and Media are installed once. Product deployment commands never recreate them and never delete their named volumes. Normal upgrades replace only versioned application containers, so databases, credentials, uploads, and application storage remain stable.

## First installation

Docker Desktop or Docker Engine with Compose v2 is required. From the repository root:

```bash
bash .container/setup.sh billing
```

On first use, `prepare-env.sh` creates the ignored `.container/deploy.env`. `DB_USER`, `DB_PASSWORD`, and `DB_MASTER_NAME` are imported from the repository `.env`; missing infrastructure secrets are generated. Once created, deployment credentials are retained across subsequent setup and upgrade runs. Review the file before production use, especially public origins, registry, administrator values, and `CODEXSUN_VERIFIED_BACKUP_ID`.

MariaDB listens inside Docker on `3306` and is exposed to the host at `127.0.0.1:3307` by default. Applications use the private `codexsun-mariadb:3306` address.

## Development and release updates

For a local source update, rebuild and replace only the selected product:

```bash
bash .container/deploy.sh billing up
```

For a production-style immutable update, publish versioned images to a registry and pull them on the server:

```bash
# Build machine / CI
CODEXSUN_IMAGE_REGISTRY=registry.example.com/codexsun \
  bash .container/deploy.sh billing publish

# Deployment host
CODEXSUN_IMAGE_REGISTRY=registry.example.com/codexsun \
  bash .container/deploy.sh billing upgrade
```

`upgrade` pulls the selected version, runs its safe forward migrations, and recreates only that product's containers. It does not change `.container/deploy.env`, MariaDB, Redis, Media, uploads, or named volumes. Increment the root workspace version before publishing a new immutable release tag. Authenticate Docker to a private registry before `publish` or `upgrade`.

Available actions are:

```bash
bash .container/deploy.sh PRODUCT up
bash .container/deploy.sh PRODUCT --reinstall
bash .container/deploy.sh PRODUCT build
bash .container/deploy.sh PRODUCT publish
bash .container/deploy.sh PRODUCT upgrade
bash .container/deploy.sh PRODUCT migrate
bash .container/deploy.sh PRODUCT ps
bash .container/deploy.sh PRODUCT logs
bash .container/deploy.sh PRODUCT down
```

`--reinstall` performs a no-cache rebuild of the selected application stack while preserving all named volumes. `down` also preserves volumes. There is intentionally no implicit destructive reset command.

## Persistent resources

The stable Docker volumes include MariaDB data/backups, Redis data, Media files/metadata, and per-product application storage. MariaDB owns the Platform master database and tenant databases.

Before a production database migration, set `CODEXSUN_VERIFIED_BACKUP_ID` to the verified backup run ID. For a confirmed empty first install, record a unique marker such as `initial-empty-database-YYYYMMDD`.

Media administration can be reconciled independently:

```bash
bash .container/setup-media.sh
```

Only the explicit `--reinstall --wipe-media` combination removes media data; the helper validates mounts and targets before doing so.

## Default host ports

All published ports bind to `127.0.0.1` unless `CODEXSUN_BIND_ADDRESS` is changed.

| Service                  |                Host port |
| ------------------------ | -----------------------: |
| MariaDB / Redis / Media  | `3307` / `6379` / `7090` |
| Billing Platform API/Web |          `7010` / `7020` |
| Billing Core API/Web     |          `7030` / `7040` |
| Billing API/Web          |          `7050` / `7060` |

## Verification

With Billing running:

```bash
bash .container/smoke-test.sh
```

The smoke test checks every Billing HTTP service and MariaDB port/database initialization.
