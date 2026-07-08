# Task 16 - Platform Super Admin And Non-Business Module Closure

## Purpose

Complete the remaining platform-owned modules after reviewing CXSUN super-admin and platform boundaries.

Task 15 moves common/master/business-adjacent data into `apps/core`. Task 16 keeps the platform lane clean by finishing only super-admin, admin support, runtime, and orchestration modules that are not business modules.

Do not add billing, accounting, inventory, GST filing operations, contacts, products, company masters, or business entries in this task.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_16` |
| Status | `planned` |
| Depends on | Foundation review, CXSUN platform scan, Task 15 boundary |
| Focus | Super-admin/platform modules other than business/core modules |
| Last updated | `2026-06-29` |

## CXSUN Reference

CXSUN `apps/platform/README.md` says platform owns:

- platform administration
- super-admin orchestration
- tenant lifecycle
- tenant domains
- auth
- industries
- platform users
- operational queues
- master-database APIs

CXSUN super-admin navigation includes:

- Tenant
- Domain
- Subscription
- Apps
- Platform Foundation
- Industry
- Company Industry
- Admin User Manager
- ZETRO setup
- GST API setup
- Queue Manager
- Database Manager
- Dev Docs

CXSUN admin software desk includes:

- Helpdesk
- Bugs

## Platform Ownership Boundary

Platform owns:

- super-admin console
- staff/admin console
- tenant registry
- tenant domains and domain resolution
- tenant provisioning
- platform auth and admin users
- platform RBAC policy catalog
- tenant policy publishing/assignment hooks
- industry catalog
- company-industry mapping only as platform classification, not company master data
- subscription apps, plans, tenant subscriptions, and subscription payments
- app catalog and app activation
- service tokens
- platform audit
- platform settings and feature flags
- migration status
- health checks
- queue manager
- database manager
- system update/status page
- project/dev docs page
- support/helpdesk shell
- bug triage shell
- provider setup shells for platform-owned integrations

Platform does not own:

- common lookup masters
- contacts
- companies as business master data
- products/items
- addresses/banks/tax identity shared blocks
- invoices, receipts, payments, purchases, quotations, ledgers, stock, reports
- tenant site/blog/mail business content

Those belong to `core` or later app-specific modules.

## Platform Module Folder Rule

All platform modules must be split into their own folders. Do not build one large super-admin module, one mixed platform service, or one shared file that owns unrelated platform areas.

Required folder pattern:

```text
apps/platform/api/src/tenants/
apps/platform/api/src/tenant-domains/
apps/platform/api/src/subscriptions/
apps/platform/api/src/apps/
apps/platform/api/src/industries/
apps/platform/api/src/company-industries/
apps/platform/api/src/admin-users/
apps/platform/api/src/platform-rbac/
apps/platform/api/src/sessions/
apps/platform/api/src/audit/
apps/platform/api/src/migrations/
apps/platform/api/src/health/
apps/platform/api/src/settings/
apps/platform/api/src/feature-flags/
apps/platform/api/src/queue-manager/
apps/platform/api/src/database-manager/
apps/platform/api/src/dev-docs/
apps/platform/api/src/support/
apps/platform/api/src/zetro-setup/
apps/platform/api/src/gst-provider-setup/

apps/platform/web/src/pages/sa/tenants/
apps/platform/web/src/pages/sa/tenant-domains/
apps/platform/web/src/pages/sa/subscriptions/
apps/platform/web/src/pages/sa/apps/
apps/platform/web/src/pages/sa/industries/
apps/platform/web/src/pages/sa/company-industries/
apps/platform/web/src/pages/sa/admin-users/
apps/platform/web/src/pages/sa/platform-rbac/
apps/platform/web/src/pages/sa/operations/
apps/platform/web/src/pages/sa/support/
```

If existing code uses flatter folders, move gradually but keep ownership explicit.

Each platform module folder should own its local contract, routes, service/repository, migration/seed registration if needed, UI page, tests, and index export.

Shared platform registries may compose modules, but future enhancements must land in the owning module folder.

Each platform module must expose a manifest or equivalent registration object:

```text
moduleKey
moduleName
moduleType
ownerApp
databasePlacement
tableNames
migrationIds
permissionKeys
routePrefix
menuRegistration
seedRegistration
dependencies
status
```

Rules:

- module keys must be stable and lowercase kebab-case
- platform module migration ids must be prefixed by `platform`
- tenant-database provisioning modules must clearly mark tenant database placement
- seeds must be idempotent
- route prefixes must match module ownership
- permissions must be declared by the owning platform module
- UI menu registration must come from the owning module where possible
- platform modules may mount/register core or app modules only through public exports
- platform modules must not own common/master/business implementation tables
- duplicate table creation across platform/core/business apps must be flagged

## CXSUN Tables To Use As Platform Reference

Keep or add platform-owned equivalents for:

- `tenants`
- `tenant_domains`
- `industries`
- `admin_users`
- `rbac_policies`
- `tenant_rbac_policies`
- `subscription_apps`
- `subscription_plans`
- `subscription_plan_apps`
- `tenant_subscriptions`
- `tenant_subscription_apps`
- `subscription_payments`
- platform migration table
- tenant migration table
- queue runtime settings
- queue jobs if platform queue persistence is implemented
- service tokens if not already covered by platform foundation
- audit events if not already covered by platform foundation
- platform notifications/mail requests/files if already foundation-owned

Do not move these tables into `apps/core`.

## Work Scope

### 1. Super Admin Navigation Map

Compare CODEXSUN super-admin UI against the CXSUN super-admin menu.

Required sections:

- Overview
- Tenants
- Tenant Domains
- Subscriptions
- Apps/App Runtime
- Platform Foundation
- Industries
- Company Industry
- Admin User Manager
- Platform Roles/Permissions
- Sessions
- Audit
- Migrations
- Health
- Settings
- Feature Flags
- Queue Manager
- Database Manager
- Dev Docs
- ZETRO Setup
- GST API Setup

Acceptance:

- Missing pages are either implemented or listed as planned placeholders.
- Navigation labels match the platform boundary.
- Business/core pages are not shown as platform-owned modules.
- Each navigation item maps to a platform module manifest or documented external app registration.
- Every platform list/show/upsert page uses the shared design-system page pattern and matches the approved Tenant list screenshot.

Approved super-admin frontend contract:

- left sidebar shows Super Admin Desk and grouped navigation
- active item uses the black selected state shown in the screenshot
- top bar shows menu button, breadcrumb/app selector, and right-side utilities
- list pages use title, muted description, right-aligned actions, search toolbar, data table, and pagination footer exactly like the screenshot
- toolbar has left search and right filters/columns buttons
- table header is compact, sortable where useful, and separated from the empty/body area
- empty table state is centered
- pagination footer is separate from the table
- no super-admin page may create its own local list/table/form design
- missing primitives must be added to `@codexsun/ui` first

### 2. Tenant Registry And Provisioning

Finish tenant lifecycle operations:

- list tenants
- show tenant
- create/update tenant
- archive/restore tenant
- provision tenant database
- view tenant database status
- view enabled apps and landing app
- record tenant payload settings

Acceptance:

- Tenant registry stays in platform.
- Tenant database provisioning hooks can apply core migrations from Task 15.
- Platform never edits core master records directly.
- Tenant registry migration remains platform-owned.
- Tenant database provisioning calls app/core migration registries instead of embedding their schemas inside platform.

### 3. Tenant Domains

Finish domain management:

- list domains
- create/update/archive domain
- primary domain flag
- landing mode/app
- tenant mapping
- domain normalization
- domain resolution test action

Acceptance:

- Public trace uses `x-correlation-id`.
- Tenant domain remains platform-owned.
- Domain UI follows Task 5 workspace/list design.

### 4. Subscriptions And App Runtime

Use CXSUN subscription model as reference:

- subscription apps
- subscription plans
- plan app mapping
- tenant subscriptions
- tenant subscription apps
- subscription payments
- app enable/disable
- landing app control

Acceptance:

- Subscription checks are no longer only placeholders.
- App availability flows from subscription/app activation.
- Platform can publish enabled apps to tenant workspaces.
- Subscription tables remain platform database tables.
- App runtime manifests are compared against subscription app registry keys.

### 5. Industries And Company Industry

Finish:

- industry catalog
- industry status
- industry metadata
- tenant/company industry classification

Boundary:

- Industry catalog is platform-owned.
- Company master data is core-owned.
- Platform may classify a tenant/company for provisioning and app defaults, but must not own company profile data.

### 6. Admin Users, Roles, Policies, Sessions

Finish platform user management:

- admin users
- staff users
- support users
- roles
- platform policies
- tenant policy publishing
- sessions
- password reset/admin status flows if foundation permits

Acceptance:

- Super-admin can manage platform/staff users.
- Tenant users remain tenant/core workspace concerns.
- Permission names are stable and documented.
- Platform RBAC policies are platform-owned.
- Tenant RBAC publishing is a platform-to-tenant integration hook, not core/common master data.

### 7. Platform Foundation Page

Expand current platform foundation page into a real status/workbench surface for:

- app registry
- platform policies
- service tokens
- audit events
- notifications
- mail requests
- files
- event/outbox processing if available

Acceptance:

- It is not just seed buttons.
- Dangerous actions are protected and auditable.
- Secrets/tokens are masked after creation.

### 8. Queue Manager

Create or complete platform queue manager:

- queue runtime settings
- job list
- job status
- retry/cancel controls if supported
- dead-letter visibility if supported
- correlationId and tenantId filters

Acceptance:

- Queue manager is platform-owned.
- Tenant business queue actions are visible only as metadata unless a module-specific page owns details.

### 9. Database Manager

Create or complete database manager:

- platform database status
- tenant database list/status
- migration status
- connection check
- backup/restore placeholders
- schema/version metadata

Acceptance:

- No raw arbitrary SQL console.
- Dangerous maintenance actions are permission-gated.
- Backup/restore can remain placeholder if implementation is not ready.

### 10. Dev Docs And System Update

Create or complete:

- project docs page
- platform build/version info
- system update/status page
- environment summary with secrets masked

Acceptance:

- Useful to super-admin/developer operators.
- Does not expose secrets or tenant business data.

### 11. Admin Software Desk

Add non-business admin/staff pages:

- Helpdesk
- Bug triage
- Support notes
- Escalation status

Acceptance:

- Support operators do not get direct tenant business data by default.
- Any tenant access link must be explicit, audited, and permission-gated.

### 12. ZETRO And GST Provider Setup Shells

Keep platform setup shells for:

- ZETRO provider setup
- ZETRO knowledge/admin setup
- GST API provider settings
- GST API sandbox/test setup

Boundary:

- Provider setup is platform-owned.
- Tenant GST compliance operations are later app/business modules.
- ZETRO business data tools remain later controlled integrations.

### 13. Platform Table And Migration Verification

Verify platform tables and migrations against Task 17 boundary rules.

Required checks:

- every platform table has exactly one platform module owner
- every platform migration id is prefixed by `platform`
- platform database migrations do not create core/common/master/business tables
- tenant provisioning migrations do not hide app-owned schemas inside platform
- subscription, tenant, domain, admin user, RBAC, industry, queue, database, and provider setup tables stay out of `apps/core`
- duplicate `CREATE TABLE` statements are flagged
- platform seeds are idempotent
- platform module manifests match real migrations

Acceptance:

- Platform can be audited without reading business app code.
- Misplaced platform artifacts are recorded for cleanup before business modules continue.

### 14. Platform Frontend Wiring Verification

Wire all platform frontend pages through the shared design system.

Required pages:

- Tenant list/show/upsert
- Tenant domain list/show/upsert
- Subscription list/show/upsert
- Apps/App Runtime list/show/upsert
- Industry list/show/upsert
- Company Industry list/show/upsert
- Admin User Manager list/show/upsert
- Platform Roles/Permissions list/show/upsert
- Sessions list/show
- Audit list/show
- Migrations list/show
- Health show
- Settings upsert
- Feature Flags list/upsert
- Queue Manager list/show/actions
- Database Manager list/show/actions
- Dev Docs list/show
- Helpdesk list/show/upsert
- Bugs list/show/upsert
- ZETRO setup pages
- GST provider setup pages

Rules:

- simple modules use `CommonList` with popup upsert
- richer modules use `MasterList` with dedicated upsert pages
- operations/status pages use show/action panels from the design system
- all pages must keep the exact look and spacing of the approved screenshot
- dummy data templates are acceptable only until APIs are wired, but page structure must be final
- screenshots should be captured during verification for desktop and mobile widths

## Platform Pending Checklist

- [ ] Super-admin navigation includes all platform sections from CXSUN.
- [ ] Tenant registry is complete.
- [ ] Tenant provisioning can trigger platform and core migrations.
- [ ] Tenant domains are complete.
- [ ] Subscription apps/plans are complete.
- [ ] Tenant subscription/app activation is enforced.
- [ ] Industry catalog is complete.
- [ ] Company-industry classification boundary is documented.
- [ ] Admin user manager is complete.
- [ ] Platform roles/policies/sessions are complete.
- [ ] Platform foundation page is expanded beyond seed buttons.
- [ ] Queue manager exists.
- [ ] Database manager exists.
- [ ] Dev docs/system update surfaces exist.
- [ ] Helpdesk and bug triage shells exist.
- [ ] ZETRO setup shell exists.
- [ ] GST provider setup shell exists.
- [ ] Platform modules are split into their own folders.
- [ ] Platform module manifests exist or missing manifests are documented.
- [ ] Platform table ownership is verified.
- [ ] Platform migration ownership is verified.
- [ ] Platform does not contain core/common/master/business migrations.
- [ ] Tenant provisioning calls app/core migration registries instead of owning their schemas.
- [ ] Platform frontend pages use the approved design-system list/show/upsert patterns.
- [ ] Super-admin list pages match the provided Tenant list screenshot.
- [ ] Missing UI primitives are added to `@codexsun/ui`, not locally duplicated.
- [ ] No core/common/master/business tables are implemented in platform.
- [ ] Platform docs are updated.
- [ ] Available checks pass.

## Documentation Updates

Update:

- `assist/execution/review.md`
- `assist/architecture/module-boundaries.md`
- `assist/architecture/tenant-isolation.md`
- `assist/architecture/data-strategy.md`
- `assist/product/domain-map.md`
- `assist/governance/api-guidelines.md`
- `assist/documentation/CHANGELOG.md`

Document:

- platform vs core ownership
- super-admin module list
- admin software desk boundary
- app/subscription activation flow
- tenant provisioning flow
- provider setup shell boundaries

## Verification Commands

Use `npm.cmd` on Windows:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/platform-api
```

Run framework tests if framework route/module/migration contracts change:

```bash
npm.cmd run test -w @codexsun/framework
```

## Completion Criteria

Task 16 is complete when the platform app is ready as the super-admin and admin operations surface for all non-business runtime control.

After completion:

- platform controls tenants, domains, auth, users, subscriptions, apps, operations, and provider setup
- core controls common/shared/master data
- future business apps control their own transactions and reports
- no module ownership remains ambiguous
