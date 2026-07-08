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
npm run dev:platform
```

Install dependencies only from this repository root. All apps, packages, and
tools resolve dependencies from the root `node_modules`; workspace-local
`node_modules` folders are removed automatically and rejected by
`npm run dependencies:check`.

Platform API: <http://127.0.0.1:5510>

Platform web: <http://127.0.0.1:5520>

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
