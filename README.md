# CODEXSUN

Software makes simple.

CODEXSUN is a monorepo foundation for a multi-tenant business application
platform. The current workspace includes the Platform API, Platform web shell,
shared Framework, Platform, and UI packages, Core business modules, Billing
entry modules, Accounts modules, master database bootstrap, and
version/changelog tooling.

## Start

```bash
npm install
npm run dev:api
npm run dev:web
```

Run API and web in separate terminals. During frontend-only work, keep `dev:api` running and restart only `dev:web`.

Install dependencies only from this repository root. All apps, packages, and
tools resolve dependencies from the root `node_modules`; workspace-local
`node_modules` folders are removed automatically and rejected by
`npm run dependencies:check`.

Platform API: <http://127.0.0.1:7010>

Platform web: <http://127.0.0.1:7020>

## Docker Deployment

Docker deployment files live in `.container/`. The stack runs Platform,
Core, Billing, Accounts, MariaDB/Redis options, and file storage as separate
containers while reusing one built application image.

```bash
cp .container/deploy.env.example .container/deploy.env
bash .container/setup.sh
```

For normal CI/CD upgrades use:

```bash
bash .container/upgrade-containers.sh
```

For a clean Docker reinstall of the app/file/Redis containers and volumes use:

```bash
bash .container/hard-reinstall.sh
```

See `.container/README.md` for internal/external MariaDB, Redis, file server,
Docker admin, MariaDB admin, Redis admin, and GitHub Actions deployment
details.

## Workspace

```text
apps/platform/api
apps/platform/web
apps/core
apps/billing
apps/accounts
packages/framework
packages/platform
packages/ui
tools/version
assist
```

## Strict UI/Form Guardrails

Before changing tenant/common/master forms, relation lookups, switch cards, placeholders, or shared form controls, read:

```text
assist/devops/ui-form-regression-guardrails.md
```

Required commands:

```bash
npm run verify:tenant-ui
npm run verify:platform-ui
```

Use `verify:tenant-ui` while developing form changes. Use `verify:platform-ui` before finishing shared UI, lookup, common module, or master module work.

## Strict App Module Shape

Business apps keep backend and frontend modules paired:

```text
apps/billing/api/src/modules/sales
apps/billing/web/src/modules/sales
apps/billing/web/src/shared
```

Backend modules must use the complete behavior-bearing file contract in `assist/architecture/module-boundaries.md`.

Frontend full modules use `index.ts`, `sales.workspace.tsx`, `sales.list.tsx`, `sales.form.tsx`, `sales.services.ts`, `sales.hooks.ts`, `sales.types.ts`, `sales.schema.ts`, and `sales.spec.ts`, with settings/print files when those capabilities exist. Alias-only wrappers and empty role files are forbidden.

Use `web/src/shared` only for cross-module web code; module-specific screens stay under `web/src/modules/{module}`.
