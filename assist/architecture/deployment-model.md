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

b2bconnect-suite
  shared packages
  framework
  platform
  core
  b2bconnect

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
  core
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

The executable local product stacks use the same composition contract:

```text
framework + platform + core + billing = billing stack
framework + platform + core + b2bconnect = b2bconnect stack
framework + platform + core + billing + ecommerce = ecommerce stack
framework + platform + core + sites = public sites stack
```

The executable container layout lives under `.container/`. MariaDB, Redis, and Media form one
persistent infrastructure layer; Billing, Ecommerce, B2B Connect, and Sites are separate Compose
projects. A normal product upgrade pulls versioned images, applies only that product's forward
migrations, and replaces only its application containers. It must preserve the deployment input,
credentials, named volumes, databases, uploads, and the other product stacks. The static Sites
runtime ships only compiled public assets even though Framework/Platform/Core changes participate in
its release-impact contract.

Platform supplies identity, tenant, permission, activation, audit, queue, storage, and operational
services. Core supplies tenant-owned common masters through fixed public contracts. Billing remains
the owner of invoices and financial documents. B2B Connect and Ecommerce own their marketplace
entities and workflows and must never write directly to Platform, Core, Billing, or each other's
tables. A stack is a deployment composition, not a shared business CRUD boundary.

### Fixed-tenant product deployments

B2B Connect is a fixed-tenant product deployment. Its branded frontend owns the login experience,
but Platform is the only credential and session authority. The frontend submits the deployment's
code-owned tenant code to Platform without rendering a tenant/corporate-ID field. Platform returns
the signed tenant identity and resolved tenant database; B2B verifies that token, tenant headers, and
deployment tenant code before serving `/app` requests. `/admin` accepts Platform staff identity and
`/sa` accepts Platform super-admin identity. B2B must never issue a parallel application JWT.

The monorepo is a development and build boundary, not a production data boundary. A deployed B2B
stack runs Platform, Core, and B2B services as separately replaceable containers. Each named B2B
deployment receives its own Platform master database, tenant/Core database, and B2B-owned marketplace
database volume. No database volume or application secret may be shared with a differently named
deployment. The B2B marketplace database may omit per-row tenant keys only while this one-tenant-per-
deployment invariant is enforced by container and volume ownership.

Core reuse occurs only through Core's public API contracts with the Platform token plus trusted
`x-tenant-id` and `x-tenant-db` context. B2B cannot import Core private modules or access Core tables.
A new capability moves into Core only after it is stable, genuinely common across products, and has
a public contract; product-specific workflow and CRUD stay in their owning app.

### Development failure boundaries

Product development commands own only their product processes. `npm run dev:b2bconnect` treats
Platform and Core as dependencies: if their configured ports expose the expected healthy service,
the runner attaches to them and leaves them running when B2B stops. If a dependency port belongs to
an unknown or unhealthy process, startup fails without killing that process. The runner starts a
missing dependency only when its port is free and then owns that child for the lifetime of the command.

This means ordinary B2B API/web edits restart only B2B watchers and cannot take over Billing ports.
Billing, B2B Connect, and Ecommerce may run concurrently against one healthy local foundation.
Changing Framework, Platform, Core, or another public foundation contract is intentionally wider work:
`npm run stack:impact -- <changed files>` lists every product verification gate that must run. A change
under `apps/b2bconnect/` impacts only B2B; Billing changes also impact Ecommerce because Ecommerce
consumes Billing; shared foundation changes impact all product stacks.

### Independent live releases

Each product has an independent deployment release line even though npm workspace package versions
remain lockstep for repository compatibility. Deployment tags use `v-billing-X.Y.Z`,
`v-b2bconnect-X.Y.Z`, `v-ecommerce-X.Y.Z`, and `v-sites-X.Y.Z`. A product major/minor/patch release builds and replaces
only the product services declared by `tools/product-stack-contract.mjs`; healthy foundation services
remain unchanged. Use `npm run stack:plan -- b2bconnect` to print the exact verification, service,
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
must never be hidden inside a B2B image or trigger an automatic all-stack live deployment.

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

The non-container hosted baseline serves `dist/apps/platform/web` as static files through nginx and runs the compiled
Platform, Core, and Billing API servers under systemd. Production nginx must not proxy the web root to Vite, and
hosted services must not depend on `npm run dev` remaining attached to a shell.

Public client sites are separate Sites artifacts. Each supported client build is emitted beneath
`dist/apps/sites/web/{client}` and should be mapped to its own hostname by the static host or edge layer. The initial
clients are `codexsun`, `logicx`, and `techmedia`. A client build must not infer tenant workspace identity or reuse the
Platform tenant-domain table; public-site publishing and tenant workspace access remain separate concerns.

Local Windows development mirrors that ownership with a host gateway on `127.0.0.1:80`: `codexsun.test`,
`logicx.test`, and `techmedia.test` route to their independent Sites dev servers, while `app.codexsun.test` and tenant
app hosts such as `aaran.test` route to Platform. Platform `/` is an app-workspace portal, not a marketing site.
Browser API traffic stays on same-origin gateway paths: `/api/platform` reaches Platform, `/api/core` reaches Core,
and `/api/billing` reaches Billing. The Platform path preserves the original host for tenant-domain resolution, while
all paths retain tenant access headers. The root `npm run dev:domains` command starts the APIs, Platform web, all three
Sites clients, and this gateway.

The public app portal is a safe tenant projection. Shared navigation, slider, features, updates, and footer components
are rendered by Platform, while tenant-specific content is stored under `tenants.payload_settings.appPortal`. The
exact app hostname must be registered through Tenant Domains; the canonical Platform hostname may resolve the
configured default tenant. A tenant's optional public marketing URL is content only and does not create a Sites
runtime dependency. Authenticated dashboard Home actions return to the Platform root on the current app origin.

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
