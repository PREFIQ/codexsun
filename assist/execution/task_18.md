# Task 18 - E2E Verification Closure For Tenant And Industry

## Purpose

Fix the blockers found during Vitest and Playwright verification for the tenant and industry flows, then add repeatable E2E and performance tests so these regressions cannot return.

This task is not a new feature task. It is a verification closure task for platform frontend, API coverage, startup timing, page loading timing, and the approved design-system wiring.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_18` |
| Status | `planned` |
| Depends on | Task 16, Task 17, approved screenshot design contract |
| Focus | Tenant + industry E2E, Vitest blockers, Playwright setup, startup/page performance |
| Last updated | `2026-06-29` |

## Verification Performed

Commands run:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/framework
npm.cmd run test -w @codexsun/platform-api
npx.cmd playwright install chromium
npm.cmd run build -w @codexsun/platform
npm.cmd run dev -w @codexsun/platform-api
npm.cmd run dev -w @codexsun/platform-web
```

Manual Playwright browser checks were run against:

```text
http://127.0.0.1:5520/sa/login
http://127.0.0.1:5520/sa
```

Screenshots captured:

```text
storage/verification/blank-login.png
storage/verification/sa-token-entry.png
storage/verification/sa-overlap-blocker.png
storage/verification/sa-tenants-dispatch.png
storage/verification/sa-industries-dispatch.png
```

## Current Results

### Passing

- Framework Vitest passed: 30 tests.
- Super-admin login API works.
- `GET /auth/session` works with super-admin token.
- `GET /admin/tenants` works with super-admin token.
- `GET /admin/console` works.
- `GET /admin/health` works.
- API correlation header was preserved in manual API calls.

### Failing

- Workspace typecheck fails.
- Workspace lint fails.
- Platform API Vitest fails.
- Playwright is not configured as a repo test runner.
- Browser E2E cannot be considered passing because layout and missing route blockers exist.

## Timing Observed

Startup:

- Platform API dev startup with prebuild took about 16 seconds wall time in the manual run.
- API health request completed in about 4.67 ms after startup.
- Platform web Vite initially reported ready in 721 ms.
- Platform web Vite after restart reported ready in 573 ms.

Page/API timing from manual Playwright/API checks:

- `/sa` rendered after token injection in about 1254 ms.
- Tenant page state switch by dispatch took about 1243 ms.
- Industry page state switch by dispatch took about 1251 ms.
- `GET /auth/session`: 5 ms.
- `GET /admin/tenants`: 5 ms.
- `GET /admin/console`: 5 ms.
- `GET /admin/health`: 3 ms.
- `GET /admin/industries`: 404 in 2 ms.

These numbers are dev-mode timings. Task 18 must add repeatable measurements for both dev and production build preview.

## Blockers To Fix

### 1. Platform Web Typecheck Fails

Observed failures:

- `apps/platform/web/src/pages/AdminDesk.tsx`
- `apps/platform/web/src/pages/sa/DatabaseManager.tsx`
- `apps/platform/web/src/pages/sa/GstSetup.tsx`
- `apps/platform/web/src/pages/sa/Subscriptions.tsx`
- `apps/platform/web/src/pages/sa/TenantDomains.tsx`

Problems:

- `StatusBadge` is being passed unsupported tones such as `success` and `danger`.
- `StatusBadge` is being passed a `label` prop where the component expects children.

Acceptance:

- `npm.cmd run typecheck` passes.
- Status tone usage is standardized across the design system.
- If `success/danger` are desired aliases, add them in `@codexsun/ui` intentionally. Otherwise use existing supported tones everywhere.

### 2. Lint Fails

Observed failures:

- `apps/platform/api/src/admin/routes.ts`: unused `err`.
- `apps/platform/web/src/pages/sa/DevDocs.tsx`: unused `StatusBadge`.
- `apps/platform/web/src/pages/sa/QueueManager.tsx`: unused `StatusBadge`, unused `recentEvents`.
- `apps/platform/web/src/pages/sa/Support.tsx`: unused `StatusBadge`, unused selected state variables.

Also observed warnings:

- `apps/core/src/api/**`: many `any` types.

Acceptance:

- `npm.cmd run lint` passes with zero errors.
- Core `any` warnings are either fixed or explicitly accepted by a local typed route adapter pattern.

### 3. Platform API Vitest Fails

Observed:

```text
apps/platform/api/src/__tests__/core-routes.test.ts
8 failed, 94 passed
```

Failing area:

- company create returns 400 instead of 200
- company list/show/update then fail because create did not return an id
- product create returns 400 instead of 200
- product list/show/update then fail because create did not return an id/code

Acceptance:

- Fix request schema/test payload mismatch for core company and product routes.
- `npm.cmd run test -w @codexsun/platform-api` passes.
- Add assertion for real validation error body when a create request returns 400.

### 4. Playwright Is Not A Proper Repo Test Runner Yet

Observed:

- No `playwright.config.ts`.
- No E2E test folder.
- No package script for Playwright.
- Browser runtime had to be installed manually.
- Manual run had to use system Chrome channel.

Acceptance:

- Add Playwright as a proper dev dependency if not already declared.
- Add browser install guidance/script.
- Add `playwright.config.ts`.
- Add scripts:

```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

- Tests start or reuse platform API/web servers with stable ports.
- Screenshots/traces are retained on failure.

### 5. Web Runtime Can Blank If Platform Dist Is Missing

Observed:

- Browser initially rendered a blank page.
- Vite requested `packages/platform/dist/api-client/client.js` and got 404.
- Running `npm.cmd run build -w @codexsun/platform` created the missing dist file and allowed the app to render.

Acceptance:

- Platform web dev must not depend on a stale or missing package dist.
- Choose one clean solution:
  - make platform-web predev build required package deps, or
  - configure Vite workspace aliases to source files, or
  - ensure package build artifacts are always generated before web starts.
- Add an E2E smoke test that fails if `#root` stays empty after route load.

### 6. Super Admin Layout Has Click-Blocking Overlap

Observed:

- Normal Playwright click on `Tenants` failed.
- The left sidebar intercepted pointer events over the top nav/action area.
- The `Tenants` top button was rendered around x=123 while the sidebar occupied that same horizontal region.

Acceptance:

- Content/action area must start after the sidebar, not underneath it.
- Playwright must be able to click Tenants and Industries without `force: true` or manual DOM dispatch.
- Desktop screenshot must match the approved screenshot layout.
- Mobile/tablet must not overlap side menu, top bar, content, buttons, tables, or pagination.

### 7. Tenant Frontend Does Not Match Approved Design

Observed:

- Current tenant page is an older card/list UI.
- It does not match the approved Tenant list screenshot.
- It does not use the required search toolbar, columns/filter buttons, table panel, empty state, and pagination footer pattern.
- It uses top button navigation instead of the expected sidebar/shell routing pattern.

Required tenant pages:

- Tenant list
- Tenant show
- Tenant popup or dedicated upsert according to module complexity
- Tenant archive/restore confirmation

Acceptance:

- Tenant list uses the shared design-system list component.
- Tenant page visually matches the screenshot.
- Tenant list has search, filters, columns, sortable table headers, action column, empty state, and pagination footer.
- Tenant show page uses reusable show sections.
- Tenant upsert uses reusable form panels and action footer.
- E2E covers list, create/upsert, show, edit, archive/restore if supported.

### 8. Industry API And Frontend Are Placeholder

Observed:

- `GET /admin/industries` returns 404.
- Industry page is static placeholder content.
- No list/show/upsert flow exists.
- No migration/table verification exists for industry.

Acceptance:

- Add industry API routes or explicitly mount existing industry service routes:
  - list
  - show
  - create/update
  - archive/restore
- Add industry table/migration ownership verification.
- Add industry UI with the same approved list/show/upsert design pattern.
- Add E2E for industry list, create/upsert, show, edit, archive/restore if supported.

### 9. Navigation Must Use Stable Routes

Observed:

- Super-admin pages are switched by local React state in `SaDesk`.
- Buttons span horizontally and can collide with layout.
- E2E cannot deep-link directly to `/sa/tenants` or `/sa/industries`.

Acceptance:

- Add stable routes:
  - `/sa/tenants`
  - `/sa/tenants/:id`
  - `/sa/tenants/new`
  - `/sa/tenants/:id/edit`
  - `/sa/industries`
  - `/sa/industries/:id`
  - `/sa/industries/new`
  - `/sa/industries/:id/edit`
- Sidebar navigation updates route, not only local state.
- Breadcrumbs reflect route.
- E2E can load pages directly by URL.

### 10. Performance Budget Is Missing

Add budgets:

- API dev startup target: document current and improve if over agreed threshold.
- Web Vite startup target: under 2 seconds after dependencies are warm.
- Auth session API: under 100 ms locally.
- Tenant list API: under 150 ms locally for seeded data.
- Industry list API: under 150 ms locally.
- First super-admin route render in dev: under 2 seconds.
- In-page navigation: under 500 ms after data is cached, under 1.5 seconds uncached.

Acceptance:

- Playwright records navigation/page timings.
- Vitest or API tests record critical API timings where reasonable.
- Performance report is written to `storage/verification` or Playwright artifacts.

## Required E2E Tests

Create:

```text
apps/platform/web/e2e/sa-tenant.spec.ts
apps/platform/web/e2e/sa-industry.spec.ts
apps/platform/web/e2e/performance.spec.ts
```

Tenant E2E:

- login as super-admin
- open `/sa/tenants`
- verify screenshot-compatible list shell
- search tenant
- open filters
- open columns
- create tenant
- show tenant
- edit tenant
- archive/suspend tenant
- restore tenant if supported
- verify no console errors
- verify no failed network requests

Industry E2E:

- login as super-admin
- open `/sa/industries`
- verify screenshot-compatible list shell
- create industry
- show industry
- edit industry
- archive/restore if supported
- verify API route exists
- verify no console errors
- verify no failed network requests

Performance E2E:

- measure login route load
- measure `/sa` load
- measure `/sa/tenants` load
- measure `/sa/industries` load
- record API response timings for tenant and industry list
- fail or warn when budgets are exceeded

## Required Vitest Coverage

Add or fix API tests for:

- tenant list/show/create/update/archive/restore
- industry list/show/create/update/archive/restore
- unauthorized access
- forbidden access
- validation failure bodies
- correlation id meta
- tenantId remains separate from correlation id
- performance sanity for list endpoints where practical

## Documentation Updates

Update:

- `assist/execution/review.md`
- `assist/execution/boundary-review.md` if it exists
- `assist/governance/testing-strategy.md`
- `assist/governance/api-guidelines.md`
- `assist/documentation/CHANGELOG.md`

Document:

- how to run Vitest
- how to run Playwright
- browser installation requirement
- super-admin E2E credentials for local test only
- performance budgets and observed timings
- known blocked flows

## Completion Checklist

- [ ] Typecheck passes.
- [ ] Lint passes.
- [ ] Framework Vitest passes.
- [ ] Platform API Vitest passes.
- [ ] Playwright is configured in the repo.
- [ ] Playwright browser install is documented/scripted.
- [ ] Web dev no longer blanks when package dist is missing.
- [ ] Super-admin layout no longer has pointer interception.
- [ ] Tenant page matches approved screenshot design.
- [ ] Tenant list/show/upsert E2E passes.
- [ ] Industry API exists.
- [ ] Industry page matches approved screenshot design.
- [ ] Industry list/show/upsert E2E passes.
- [ ] Stable `/sa/tenants` and `/sa/industries` routes exist.
- [ ] Startup timing is measured and recorded.
- [ ] Page load timing is measured and recorded.
- [ ] Performance budgets are documented.
- [ ] Verification artifacts are saved.

## Completion Criteria

Task 18 is complete only when a clean checkout can run one command for Vitest and one command for Playwright and prove tenant and industry flows from login to list/show/upsert without layout blockers, console errors, missing routes, or failed network requests.
