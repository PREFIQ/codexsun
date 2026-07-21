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

crm-suite
  shared packages
  framework
  platform
  core
  crm

```

Each bundle may eventually have its own API, Web, and Worker images:

```text
docker/
  billing/
    api.Dockerfile
    web.Dockerfile
    worker.Dockerfile

  crm/
    api.Dockerfile
    web.Dockerfile
    worker.Dockerfile

```

The source code remains app-owned and modular. Containers bind selected apps and shared packages together.

The executable local product stacks use the same composition contract:

```text
framework + platform + core + billing = billing stack
```

The executable container layout lives under `.container/`. MariaDB, Redis, and Media form one
persistent infrastructure layer alongside the independent Billing Compose project. A normal product upgrade pulls
versioned images, applies only Billing's forward migrations, and replaces only its application containers. It must
preserve the deployment input, credentials, named volumes, databases, and uploads.

Platform supplies identity, tenant, permission, activation, audit, queue, storage, and operational
services. Core supplies tenant-owned common masters through fixed public contracts. Billing remains
the owner of invoices and financial documents. A stack is a deployment composition, not a shared
business CRUD boundary.

### Development failure boundaries

Product development commands own only their product processes. If a dependency port belongs to an
unknown or unhealthy process, startup fails without killing that process. The runner starts a missing
dependency only when its port is free and then owns that child for the lifetime of the command.

Changing Framework, Platform, Core, or another public foundation contract is intentionally wider work:
`npm run stack:impact -- <changed files>` lists every product verification gate that must run. A change
to shared foundation code impacts all product stacks.

### Independent live releases

Each product has an independent deployment release line even though npm workspace package versions
remain lockstep for repository compatibility. Deployment tags use `v-billing-X.Y.Z`. A product
major/minor/patch release builds and replaces only the product services declared by
`tools/product-stack-contract.mjs`; healthy foundation services
remain unchanged. Use `npm run stack:plan -- billing` to print the exact verification, service,
database, rollout, and rollback boundary.

Production rollout must use an inactive/blue-green slot or a rolling replacement with readiness and
health gates. Traffic moves only after the new product API and web are healthy. Rollback switches
traffic to the previous product release without reverting Platform, Core, Billing, or another product.
Product database migrations are restricted to the product-owned scope and use expand-contract:
backward-compatible additions deploy first, destructive contraction occurs only after the rollback
window. A migration requiring an immediate destructive change is not independently deployable.

Shared public contracts remain backward compatible across supported product releases. A breaking
Platform/Core contract is introduced beside the old contract, consumers migrate and release one stack
at a time, and the old contract is removed only after usage reaches zero. A shared dependency change
must never be hidden inside a product image or trigger an automatic all-stack live deployment.

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
dist/apps/crm/web
dist/packages/framework
dist/packages/platform
dist/packages/ui
```

Root build/dev workflows should clean app-local `.turbo` folders under `apps/` so package outputs and Docker build contexts stay predictable.

## Hosted Platform Runtime

The non-container hosted baseline serves `dist/apps/platform/web` as static files through nginx and runs the compiled
Platform, Core, and Billing API servers under systemd. Production nginx must not proxy the web root to Vite, and
hosted services must not depend on `npm run dev` remaining attached to a shell.

Local Windows development uses a host gateway on `127.0.0.1:80`: `app.codexsun.test` and tenant app hosts such as
`aaran.test` route to Platform. Platform `/` is an app-workspace portal.
Browser API traffic stays on same-origin gateway paths: `/api/platform` reaches Platform, `/api/core` reaches Core,
and `/api/billing` reaches Billing. The Platform path preserves the original host for tenant-domain resolution, while
all paths retain tenant access headers. The root `npm run dev:domains` command starts the APIs, Platform web, and this
gateway.

The public app portal is a safe tenant projection. Shared navigation, slider, features, updates, and footer components
are rendered by Platform, while tenant-specific content is stored under `tenants.payload_settings.appPortal`. The
exact app hostname must be registered through Tenant Domains; the canonical Platform hostname may resolve the
configured default tenant. A tenant's optional public URL is external content only. Authenticated dashboard Home
actions return to the Platform root on the current app origin.

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
