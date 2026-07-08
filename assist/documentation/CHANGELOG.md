# Changelog

## Version State

Current version: 1.0.1

Release tag: v-1.0.1

Changelog label: v 1.0.1

This changelog starts fresh from the cleaned CODEXSUN foundation. Earlier copied application history was intentionally removed because it did not represent the current workspace.

New entries should keep database-facing work and application code work separate.

#### Database Changes

Records schema, migration, seed, tenant provisioning, and data compatibility changes.

#### App Codebase Changes

Records UI, API, service logic, tooling, packaging, and documentation changes.

## v-1.0.1

### [v 1.0.1] 2026-07-08 2:12 pm - Clean Platform Foundation

#### Database Changes

- Removed copied demo tenant seed data from the Platform API in-memory tenant repository.
- Kept the tenant registry empty by default so the platform starts without fake customer data.
- Kept tenant module persistence as an in-memory foundation only; no production database migration was added in this baseline.

#### App Codebase Changes

- Reduced the copied workspace to the current runnable foundation: `apps/platform/api`, `apps/platform/web`, `packages/framework`, `packages/ui`, and tooling.
- Removed stale Core, Billing, Accounts, Ecommerce, CRM, Sites, and copied Platform package wiring from workspace references, dependency manifests, TypeScript config, Vite aliases, package lock state, preflight, and dist collection.
- Reorganized Platform Web into a clean source structure:
  - `src/app` for bootstrap, providers, router, and design-system setup.
  - `src/desks` for `/sa`, `/admin`, and `/app` desk shells.
  - `src/modules/tenant` for the tenant frontend module.
  - `src/routes/public` for home, login, and status routes.
  - `src/shared` for API client, auth gate, and document title helpers.
- Removed the old `src/pages` dumping area, copied super-admin pages, template pages, design-system demo page, and stale tenant pages.
- Added the first standard Platform API module under `apps/platform/api/src/modules/tenant` using the required module file pattern:
  - `tenant.module.ts`
  - `tenant.service.ts`
  - `tenant.repository.ts`
  - `tenant.routes.ts`
  - `tenant.events.ts`
  - `tenant.migration.ts`
  - `tenant.worker.ts`
  - `tenant.seed.ts`
  - `tenant.sync.ts`
  - `tenant.test.ts`
  - `tenant.types.ts`
  - `index.ts`
- Updated the module-boundary checker to validate the current one-folder, module-prefixed file standard instead of the older folder-heavy pattern.
- Replaced the Platform Web API client with a local envelope-aware fetch client.
- Simplified Platform API auth/session routes into a development foundation without fake tenant records.
- Cleaned `/`, `/sa`, `/admin`, `/app`, and `/status` so they no longer show demo tenant names, fake databases, fake users, scaffold labels, or copied product claims.
- Removed unimplemented future module choices from tenant setup; tenant access now only guarantees `platform.tenant`.
- Removed copied API JSON registries, old e2e references, invalid database scripts, and stale Playwright config.
- Removed unused demo dashboard blocks and fake menu defaults from `packages/ui`.
- Pruned copied public/design/print CSS from Platform Web and kept only styles used by the current routes.
- Set Vite cache under the root dependency tree and kept a single root `node_modules`.
- Kept build output collected under the root `dist/` packaging surface.
- Verified the cleaned foundation with:
  - `npm.cmd run check`
  - `npm.cmd run build`
  - route smoke checks for `/`, `/sa`, `/admin`, `/app`, and `/status`.
