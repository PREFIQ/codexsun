# Task 17 - App Boundary Table And Migration Verification

## Purpose

Segregate all CXSUN-inspired modules into correct CODEXSUN app boundaries, then verify every table, migration, seed, route, and UI entry belongs to the right owner.

This task is a boundary audit and correction task. Do not add new business features here. Move or mark misplaced modules before implementing more platform, core, or business app work.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_17` |
| Status | `planned` |
| Depends on | Task 15, Task 16, CXSUN table/module scan |
| Focus | Table ownership, migration ownership, and app-level module boundaries |
| Last updated | `2026-06-29` |

## Goal

Create a verified ownership map for:

- platform tables and migrations
- core common/master tables and migrations
- billing/accounting transaction tables and migrations
- mail tables and migrations
- sites/blog tables and migrations
- ZETRO/AI tables and migrations
- GST/compliance provider and tenant-operation tables
- framework/runtime infrastructure tables

Then update the codebase so each table and migration is registered at its owning app boundary.

## Boundary Map

### Platform App

Owner:

```text
apps/platform
packages/platform
```

Platform owns super-admin and non-business orchestration.

Tables/migrations that belong here:

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
- platform migrations table
- tenant migrations table
- platform audit/session/settings/feature-flag tables
- platform files/notifications/mail-request foundation tables if already foundation-owned
- service token tables

Platform may register route adapters for core and app modules, but must not own their business tables.

### Core App

Owner:

```text
apps/core
```

Core owns reusable common/shared/master modules.

Tables/migrations that belong here:

- common master definitions
- common master records
- countries
- states
- districts
- cities
- pincodes
- contact groups
- contact types
- address types
- bank names
- product groups
- product categories
- product types
- units
- hsn codes
- taxes
- brands
- colours
- sizes
- styles
- currencies
- priorities
- payment terms
- accounting year/month lookup definitions
- sales account type lookup definitions
- order type lookup definitions
- transports
- warehouses
- destinations
- stock rejection types
- contacts
- contact emails
- contact phones
- contact addresses
- contact social links
- contact bank accounts
- contact GST/tax details
- contact code sequences
- companies as business master data
- company addresses
- company GST/tax details
- company bank accounts
- products/items
- product classification links
- shared address/bank/tax/phone/email blocks

Core must not own tenant registry, subscription, invoices, ledgers, stock postings, site content, mailboxes, or AI conversations.

Core folder rule:

- every common/master module must live in its own folder
- future enhancements must be made inside that module folder
- shared registries may compose modules, but must not become one central mega-module
- each module folder should own its contract, definition, validation, migration/seed registration, UI schema, tests, and index export where applicable

Examples:

```text
apps/core/src/common/location/countries/
apps/core/src/common/product/units/
apps/core/src/common/product/taxes/
apps/core/src/common/contacts/contact-types/
apps/core/src/master/contacts/
apps/core/src/master/companies/
apps/core/src/master/products/
apps/core/src/shared/address/
```

### Billing App

Owner:

```text
apps/billing
```

Billing owns entry modules, billing reports, accounting, and billing-specific settings.

Tables/migrations that belong here:

- `sales_entries`
- `sales_entry_items`
- `sales_entry_comments`
- `sales_entry_activities`
- `purchase_entries`
- `purchase_entry_items`
- `purchase_entry_comments`
- `purchase_entry_activities`
- `quotation_entries`
- `quotation_entry_items`
- `quotation_entry_comments`
- `quotation_entry_activities`
- `export_sales_entries`
- `export_sales_entry_items`
- `export_sales_entry_comments`
- `export_sales_entry_activities`
- `receipt_entries`
- `receipt_entry_allocations`
- `receipt_entry_comments`
- `receipt_entry_activities`
- `payment_entries`
- `payment_entry_allocations`
- `payment_entry_comments`
- `payment_entry_activities`
- `account_ledgers`
- `account_groups`
- `account_vouchers`
- `account_voucher_lines`
- `account_postings`
- `account_posting_audits`
- `account_posting_rollups`
- `account_posting_rebuild_runs`
- `account_book_comments`
- `account_book_activities`
- `accounting_period_locks`
- `entry_correction_audit`
- billing document number settings if scoped only to billing documents
- billing sales/settings tables

Billing may depend on core contacts, companies, products, units, taxes, and addresses.

### Mail App

Owner:

```text
apps/mail
```

Tables/migrations that belong here:

- `mail_settings`
- `mail_messages`
- `mail_templates`
- `mail_attachments`
- `mail_events`

Platform may own notification/mail-request queue foundation. Mail app owns workspace mailboxes, templates, SMTP settings, and sent/draft/outbox content.

### Sites App

Owner:

```text
apps/sites
```

Tables/migrations that belong here:

- `site_sliders`
- `site_slider_activities`
- `site_pages`
- `site_services`
- `site_posts`
- `site_messages`
- site theme/settings/domain-content tables

Platform owns tenant domain mapping. Sites owns tenant public-site content.

### Blog App

Owner:

```text
apps/blog
```

If blog remains inside sites temporarily, keep a clear app module boundary until it is split.

Tables/migrations that belong here:

- `blog_categories`
- `blog_tags`
- `blog_posts`
- `blog_post_tags`
- `blog_comments`
- `blog_ratings`
- `blog_likes`
- `blog_shares`
- `blog_images`
- `blog_seo`

### ZETRO App

Owner:

```text
apps/zetro
```

Tables/migrations that belong here:

- `conversations`
- `agent_logs`
- `knowledge_documents`
- `agent_provider_connections`
- `zetro_query_tools`
- `zetro_query_mappings`
- `zetro_query_logs`

Platform may own provider setup shell/navigation. ZETRO owns AI conversation, knowledge, query mapping, and agent runtime data.

### GST/Compliance App

Owner:

```text
apps/compliance
```

If no separate compliance app exists yet, keep provider setup shell in platform and defer tenant operation tables until the compliance app is created.

Tables/migrations that belong here:

- `gst_provider_settings`
- `gst_provider_tokens`
- `gst_compliance_documents`
- `gst_compliance_operations`

Platform may own:

- `gst_provider_global_settings`

Only if it is truly global provider configuration. Tenant GST documents/operations must not live in platform.

### Framework Runtime

Owner:

```text
packages/framework
apps/platform/api runtime integration
```

Framework/platform runtime owns infrastructure contracts, not business modules.

Tables/migrations that may belong here or platform runtime:

- queue runtime settings
- queue jobs
- event outbox
- migration registry tables
- health/runtime status metadata

Keep this area minimal and generic. Do not put app-specific business payload schemas here.

## Required Work

### 1. Scan Current CODEXSUN Tables And Migrations

Scan:

- `apps/**/src/**/migration*`
- `apps/**/src/**/migrations/**`
- `packages/**/src/**/migration*`
- `apps/platform/api/src/db/migrations`
- any SQL strings with `CREATE TABLE`

Create an inventory with:

- table name
- owning app/package
- migration file
- seed file if any
- route/API owner
- UI owner if any
- status: correct, misplaced, duplicate, deferred, or unknown
- database placement: platform database, tenant database, or external/provider storage
- module manifest if present
- dependency direction

### 2. Compare With CXSUN Reference

Use CXSUN only as reference:

- `E:\Workspace\cxsun\apps\platform`
- `E:\Workspace\cxsun\apps\billing`
- `E:\Workspace\cxsun\apps\mail`
- `E:\Workspace\cxsun\apps\sites`
- `E:\Workspace\cxsun\apps\zetro`
- `E:\Workspace\cxsun\apps\frontend`

Do not copy old structure blindly. Normalize to CODEXSUN boundaries.

### 3. Move Misplaced Task 14 Artifacts

Any Task 14 common/master implementation currently under platform must be moved or marked for move into `apps/core`.

Examples:

- platform master-data routes
- platform master-data tests
- platform web tenant master pages
- platform package master-data contracts/services

Allowed platform remainder:

- route mount adapter
- navigation registration
- permission/activation integration

### 4. Verify Migration Registration Per App

Each app must register its own migrations at its boundary:

- platform migrations in platform
- core migrations in core
- billing migrations in billing
- mail migrations in mail
- sites/blog migrations in their app boundary
- ZETRO migrations in ZETRO
- compliance migrations in compliance

Tenant provisioning can call app migration registries, but platform must not contain all app schemas as one large mixed migration.

Migration verification must also check:

- migration id prefix matches owning app
- module migration id includes module key
- migration is idempotent where the runner requires repeat-safe behavior
- seed is idempotent
- rollback/cleanup note exists where destructive rollback is unsafe
- tenant-database migrations are not mixed into platform master migrations
- platform master migrations are not copied into tenant migration batches
- duplicate `CREATE TABLE` ownership is flagged
- deferred tables are documented instead of silently omitted

### 5. Verify API And UI Ownership

For every module:

- routes must live with the owner app or be mounted from that owner app
- UI pages must live with the owner app or be registered from that owner app
- platform shell may link to modules but must not own their internals
- `@codexsun/ui` remains shared design system only
- menu registration must come from the owning app/module manifest where possible
- permission keys must be declared by the owning module
- platform may aggregate navigation, but must not define module internals
- list/show/upsert UI must use the shared design-system patterns from `@codexsun/ui`
- implemented pages must match the approved Tenant list screenshot for layout, spacing, toolbar, table, empty state, and pagination
- module pages must not duplicate local table/list/form systems

### 6. Verify Dependency Direction

Dependency direction must stay clean:

```text
framework -> no app dependencies
ui -> no app business dependencies
platform -> may mount/register apps, but not own app internals
core -> may depend on framework/ui/platform contracts only where required
business apps -> may depend on core/platform contracts
```

Rules:

- platform must not import core implementation internals except through public exports
- core must not import billing/mail/sites/blog/ZETRO/compliance
- billing/mail/sites/blog/ZETRO/compliance may import core public contracts
- shared UI must not import business data services
- tests may use fixtures, but fixtures must not hide real ownership violations

### 7. Verify Module Manifest Coverage

Every app-level module should expose a manifest or equivalent registration object:

```text
moduleKey
moduleName
ownerApp
databasePlacement
tableNames
migrationIds
seedIds
permissionKeys
routePrefix
menuItems
dependencies
status
```

Acceptance:

- App shells can discover module metadata without reading implementation files.
- Boundary review can compare manifests against real migrations.
- Missing manifests are recorded as cleanup work.

### 8. Document Boundary Decisions

Create or update a boundary report:

```text
assist/execution/boundary-review.md
```

Include:

- table inventory
- migration inventory
- owner decision
- misplaced items
- duplicate items
- deferred items
- cleanup instructions
- final checklist

## Required Corrections

Correct these if found:

- common/master tables inside platform
- contact/company/product business master tables inside platform
- subscription tables inside core
- tenant/domain/admin/RBAC tables inside core
- billing entry/accounting tables inside core/platform
- mail mailbox tables inside platform/core
- site/blog content tables inside platform/core
- ZETRO conversation/query tables inside platform/core
- GST tenant compliance operation tables inside platform/core
- duplicate migrations for the same table across apps

## Acceptance Criteria

- Every known table has one owning app.
- Every migration is registered at the owning app boundary.
- Task 14 artifacts are either moved to core or explicitly marked as temporary adapters.
- Platform only owns super-admin and runtime orchestration modules.
- Core only owns reusable common/shared/master modules.
- Business apps own their transaction/content/runtime data.
- No duplicate table creation exists across app boundaries.
- Boundary report exists at `assist/execution/boundary-review.md`.
- Documentation is updated with final ownership map.

## Verification Commands

Use `npm.cmd` on Windows:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/platform-api
```

Run additional package/app tests if the boundary correction touches them:

```bash
npm.cmd run test -w @codexsun/framework
npm.cmd run test -w @codexsun/core
npm.cmd run test -w @codexsun/billing
```

Only run package-specific commands that exist in the workspace.

## Completion Checklist

- [ ] CODEXSUN migration/table scan completed.
- [ ] CXSUN reference scan completed.
- [ ] Boundary report created.
- [ ] Platform-owned tables verified.
- [ ] Core-owned tables verified.
- [ ] Billing-owned tables verified.
- [ ] Mail-owned tables verified.
- [ ] Sites/blog-owned tables verified.
- [ ] ZETRO-owned tables verified.
- [ ] GST/compliance-owned tables verified.
- [ ] Framework/runtime tables verified.
- [ ] Misplaced Task 14 artifacts identified.
- [ ] Common/master platform artifacts moved or marked for core move.
- [ ] Duplicate migrations removed or marked for cleanup.
- [ ] App migration registration is app-owned.
- [ ] API route ownership is verified.
- [ ] UI page ownership is verified.
- [ ] Documentation is updated.
- [ ] Available checks pass.

## Completion Criteria

Task 17 is complete when a new agent can look at the boundary report and know exactly where every table, migration, API route, and UI page belongs before building the next module.
