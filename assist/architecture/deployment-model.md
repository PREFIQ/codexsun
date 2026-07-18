# Deployment Model

## Deployment Goal

CODEXSUN should support flexible deployment while keeping development simple.

The platform should run as a modular monolith by default, with container boundaries prepared for scaling and tenant-specific deployment needs.

Local testing and cloud deployment should follow the same strict rules and service boundaries wherever practical.

## Runtime Surfaces

- Web application.
- API server.
- Background workers.
- Queue processor.
- Scheduler.
- Desktop app through Electron.
- Mobile app through Expo.
- Tenant databases.
- File storage.
- Integration services.

## Multi-Port And Multi-Container Direction

Different runtime parts may run on different ports and containers:

- Frontend web app.
- Backend API.
- Worker service.
- Scheduler service.
- Tenant database containers.
- Local development services.
- Integration bridge services where needed.

## App Bundle Containers

CODEXSUN should support product bundles where each container/deployment includes its own backend, frontend, workers, and selected app packages while still sharing framework, platform, and UI packages from the same codebase.

Examples:

```text
billing-suite
  shared packages
  framework
  platform
  core
  billing

ecommerce-suite
  shared packages
  framework
  platform
  core
  billing
  ecommerce

crm-suite
  shared packages
  framework
  platform
  core
  crm

sites-suite
  shared packages
  framework
  platform
  sites
```

Each bundle may eventually have its own API, Web, and Worker images:

```text
docker/
  billing/
    api.Dockerfile
    web.Dockerfile
    worker.Dockerfile

  ecommerce/
    api.Dockerfile
    web.Dockerfile
    worker.Dockerfile

  crm/
    api.Dockerfile
    web.Dockerfile
    worker.Dockerfile

  sites/
    api.Dockerfile
    web.Dockerfile
```

The source code remains app-owned and modular. Containers bind selected apps and shared packages together.

## Root Dist Rule

Build output must use the root `dist/` folder as the packaging surface. App-local `dist/` folders should not be treated as final release artifacts.

Expected shape:

```text
dist/apps/platform/api
dist/apps/platform/web
dist/apps/core
dist/apps/core/web
dist/apps/billing
dist/apps/billing/web
dist/apps/ecommerce/web
dist/apps/crm/web
dist/apps/sites/web
dist/packages/framework
dist/packages/platform
dist/packages/ui
```

Root build/dev workflows should clean app-local `.turbo` folders under `apps/` so package outputs and Docker build contexts stay predictable.

## Hosted Platform Runtime

The non-container hosted baseline serves `dist/apps/platform/web` as static files through nginx and runs
`dist/apps/platform/api/server.js` under systemd. Production nginx must not proxy the web root to Vite, and hosted
services must not depend on `npm run dev` remaining attached to a shell.

Public client sites are separate Sites artifacts. Each supported client build is emitted beneath
`dist/apps/sites/web/{client}` and should be mapped to its own hostname by the static host or edge layer. The initial
clients are `codexsun`, `logicx`, and `techmedia`. A client build must not infer tenant workspace identity or reuse the
Platform tenant-domain table; public-site publishing and tenant workspace access remain separate concerns.

Local Windows development mirrors that ownership with a host gateway on `127.0.0.1:80`: `codexsun.test`,
`logicx.test`, and `techmedia.test` route to their independent Sites dev servers, while `aaran.test` routes to Platform.
Platform API traffic stays on `/api/platform`, preserves the original host, and is resolved through the tenant-domain
module. The root `npm run dev:domains` command starts the APIs, Platform web, all three Sites clients, and this gateway.

The maintained baseline configuration and installation commands live under `deploy/hosted/`. The Platform API binds
to loopback behind nginx, restarts automatically after failures, and exposes its existing health endpoint through
`/api/platform/health`. The Platform web build reads client variables from the root `.env`; its dev-server port is not
a production-build requirement.

## Container Rules

- Containers should be replaceable and reproducible.
- Runtime configuration should come from environment variables or secure config.
- Secrets must not be stored in images.
- Logs should be structured.
- Health checks should be available.
- Workers and API should share the same domain contracts.
- Local and cloud containers should use matching contracts, health checks, environment names, and service responsibilities.

## Tenant Deployment Options

Possible tenant deployment models:

- Shared app containers with dedicated tenant database.
- Dedicated app and database containers for selected tenants.
- Hybrid local desktop plus cloud sync.
- On-premise private deployment if business requires it.

## Scaling Direction

Scale in this order:

1. Optimize module and database design.
2. Separate workers from API.
3. Scale read-heavy reporting separately.
4. Add dedicated containers for heavy modules.
5. Split services only when module boundaries are proven.
