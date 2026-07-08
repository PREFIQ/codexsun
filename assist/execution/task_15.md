# Task 15 - Core App Common And Master Module Foundation

## Purpose

Create a separate `core` app for reusable common, shared, and master modules that every upcoming CODEXSUN business app can use.

Task 15 refines and supersedes the implementation direction of Task 14.

Move all Task 14 Common Master Data Foundation work from platform ownership into `core` ownership. Anything already planned or started under platform paths for Task 14 must be relocated to the new core app boundary. Platform may mount or consume core routes during integration, but `core` must own the common and master module contracts, services, repositories, migrations, seeds, UI pages, and reusable module exports.

Do not build billing, accounting, inventory, GST filing, POS, site/blog, mail provider, AI agent, or transaction-entry business logic in this task.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_15` |
| Status | `planned` |
| Depends on | Foundation review, Task 14 planning, CXSUN table scan |
| Focus | New `core` app for common/shared/master modules |
| Last updated | `2026-06-29` |

## Goal

Create `apps/core` as the reusable foundation app for:

- common lookup masters
- contact master foundation
- company master foundation
- product/item master foundation
- shared address, tax identity, bank, document numbering, and activity-ready contracts
- core APIs, migrations, seeds, permissions, and workspace UI screens

All future business apps must consume these core modules instead of recreating their own common/master tables and UI.

## Required Context

Read before implementation:

- `assist/execution/review.md`
- `assist/execution/task_14.md`
- `assist/README.md`
- `assist/product/domain-map.md`
- `assist/product/product-scope.md`
- `assist/architecture/module-boundaries.md`
- `assist/architecture/tenant-isolation.md`
- `assist/architecture/data-strategy.md`
- `assist/governance/api-guidelines.md`
- `assist/governance/testing-strategy.md`
- `packages/ui/src/workspace`
- `packages/platform/src/tenant`
- `packages/platform/src/permissions`
- `packages/platform/src/activation`
- `E:\Workspace\cxsun\apps\billing\src\modules\common\registry.ts`
- `E:\Workspace\cxsun\apps\billing\src\modules\common\master-record.migration.ts`
- CXSUN master/contact/company/product migration files before writing final schema

## App Boundary

Create the new app folder:

```text
apps/core/
```

Recommended structure:

```text
apps/core/package.json
apps/core/tsconfig.json
apps/core/src/index.ts
apps/core/src/common/
apps/core/src/master/
apps/core/src/shared/
apps/core/src/migrations/
apps/core/src/seeds/
apps/core/src/api/
apps/core/src/ui/
apps/core/src/testing/
```

If the repo pattern requires reusable package exports, expose the app contracts as `@codexsun/core`, but keep source ownership in `apps/core`.

## Core Module Folder Rule

All common and master modules must be split into their own folders. Do not create one large common/master file or one mixed module that owns every definition.

Required folder pattern:

```text
apps/core/src/common/location/countries/
apps/core/src/common/location/states/
apps/core/src/common/location/districts/
apps/core/src/common/location/cities/
apps/core/src/common/location/pincodes/

apps/core/src/common/contacts/contact-groups/
apps/core/src/common/contacts/contact-types/
apps/core/src/common/contacts/address-types/
apps/core/src/common/contacts/bank-names/

apps/core/src/common/product/product-groups/
apps/core/src/common/product/product-categories/
apps/core/src/common/product/product-types/
apps/core/src/common/product/units/
apps/core/src/common/product/hsn-codes/
apps/core/src/common/product/taxes/
apps/core/src/common/product/brands/
apps/core/src/common/product/colours/
apps/core/src/common/product/sizes/
apps/core/src/common/product/styles/

apps/core/src/common/orders/order-types/
apps/core/src/common/orders/transports/
apps/core/src/common/orders/warehouses/
apps/core/src/common/orders/destinations/
apps/core/src/common/orders/stock-rejection-types/

apps/core/src/common/others/currencies/
apps/core/src/common/others/priorities/
apps/core/src/common/others/payment-terms/
apps/core/src/common/others/accounting-year/
apps/core/src/common/others/months/
apps/core/src/common/others/sales-account-types/

apps/core/src/master/contacts/
apps/core/src/master/companies/
apps/core/src/master/products/

apps/core/src/shared/address/
apps/core/src/shared/bank/
apps/core/src/shared/email/
apps/core/src/shared/phone/
apps/core/src/shared/tax-identity/
apps/core/src/shared/lifecycle/
```

Each module folder should own its local contract, definition, validation, repository/service if needed, migration/seed registration if needed, UI schema if needed, tests, and index export.

Shared registries may compose these modules, but the enhancement point must stay inside the module folder. Future changes to taxes, units, contacts, products, or locations must not require editing one central mega-module except for explicit registration.

Each module folder must also expose a small manifest so the app can compose modules consistently:

```text
moduleKey
moduleName
moduleType
ownerApp
tableNames
migrationIds
permissionKeys
routePrefix
menuRegistration
seedRegistration
dependencies
```

Rules:

- module keys must be stable and lowercase kebab-case
- migration ids must include the owning app/module prefix
- seeds must be idempotent
- routes must use the owning module prefix
- UI registration must come from the owning module folder
- no module may import from a future business app
- shared helpers must live in `apps/core/src/shared` or `@codexsun/ui`, not inside one common module
- table names must not be duplicated across modules
- every module must declare whether its tables are tenant-database tables or platform-database tables

## Task 14 Migration Direction

Task 14 mentioned these platform-owned paths:

```text
packages/platform/src/master-data/
apps/platform/api/src/master-data/
apps/platform/web/src/pages/tenant/master-data/
```

For Task 15, move that ownership into core:

```text
apps/core/src/common/
apps/core/src/master/
apps/core/src/shared/
apps/core/src/api/
apps/core/src/migrations/
apps/core/src/seeds/
apps/core/src/ui/
```

Required move rules:

- common master definitions move to `apps/core/src/common`
- common record contracts, services, repositories, and migrations move to `apps/core/src/common`
- contact foundation moves to `apps/core/src/master/contacts`
- company foundation moves to `apps/core/src/master/companies`
- product/item foundation moves to `apps/core/src/master/products`
- reusable address, bank, phone, email, tax, notes, and lifecycle blocks move to `apps/core/src/shared`
- master-data API handlers move to `apps/core/src/api`
- master-data tenant migrations move to `apps/core/src/migrations`
- master-data seeds move to `apps/core/src/seeds`
- master-data workspace pages move to `apps/core/src/ui`
- platform API may only register or mount core routes
- platform web may only register shell navigation or route adapters for core pages
- platform package may only keep shared permission/activation integration hooks if those hooks are platform-owned

Do not leave Task 14 business/common-master implementation inside platform after Task 15. If any temporary platform bridge is needed, mark it clearly as an adapter and keep the real implementation in core.

Platform responsibilities:

- authenticate user
- resolve tenant
- enforce tenant activation
- mount core routes if the current runtime is monolithic
- provide permission checks and audit sink

Core responsibilities:

- own common/master definitions
- own core migrations and seeds
- own common/master services and repositories
- own common/master API handlers
- own workspace pages that use `@codexsun/ui`
- expose typed contracts for future apps

## CXSUN Table Inventory To Collect

Use the CXSUN scan as source inspiration, but do not copy tables blindly. Normalize naming and contracts for CODEXSUN.

### Include In Core Common Definitions

Create data-driven definitions and migrations/seeds for:

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
- accounting year
- months
- sales account types
- order types
- transports
- warehouses
- destinations
- stock rejection types

Expected CODEXSUN table strategy:

- either one generic tenant-scoped `core_master_records` table with `definitionKey`
- or generated tables such as `core_countries`, `core_states`, `core_units`

Choose one strategy and document it. Prefer a registry-driven model if it keeps future app onboarding simpler.

### Include In Core Master Modules

Create first-class master modules for:

- contacts
- contact emails
- contact phones
- contact addresses
- contact social links
- contact bank accounts
- contact GST/tax details
- contact code sequences
- companies
- company addresses
- company GST/tax details
- company bank accounts
- company settings/profile fields
- products/items
- product units
- product tax classification
- product category/group/type links
- product variant attributes where needed

Keep these as master data only. No ledger posting, stock posting, invoice posting, payment allocation, or compliance operation belongs here.

### Include In Core Shared Modules

Create reusable shared contracts/components for:

- address block
- phone/email block
- bank account block
- tax identity block
- notes block
- attachment reference block only if file foundation already exists
- document numbering settings
- active/archive lifecycle
- import/export-ready DTO shapes
- activity/audit integration hooks

## Tables Explicitly Deferred

Do not place these in Task 15:

- `account_ledgers`, `account_groups`, `account_vouchers`, `account_postings`, and related accounting tables
- `sales_entries`, `purchase_entries`, `quotation_entries`, `receipt_entries`, `payment_entries`, `export_sales_entries`, and related item/comment/activity tables
- GST provider, token, document, and compliance operation tables
- site, slider, page, service, blog, comment, rating, like, share, image, and SEO tables
- mail settings, messages, templates, attachments, and events
- queue runtime and queue job tables
- ZETRO/AI conversation, provider, document, query, and log tables
- platform tenant, tenant domain, admin user, RBAC, subscription, and plan tables

These remain owned by platform or later business/domain tasks.

## Work Scope

### 1. Create Core App Shell

Add `apps/core` with:

- package manifest
- TypeScript config
- public exports
- test setup if needed
- integration entrypoint for platform API
- integration entrypoint for platform web or desk shell

Acceptance:

- Workspace scripts can typecheck core.
- Core can be imported by platform without circular ownership.
- No business transaction logic exists in core.

### 2. Common Definition Registry

Build a common definition registry based on CXSUN common registry concepts.

Each definition must include:

- `definitionKey`
- `label`
- `module`
- `description`
- `fields`
- `displayField`
- `codeField`
- `statusField`
- `sort`
- `seedable`
- `requiredPermission`
- `requiredFeature`

Acceptance:

- Future apps can register new common definitions.
- Registry drives API validation and UI column/form generation.
- Definitions are tenant-aware where required.

### 3. Core Master Record Storage

Create tenant-scoped storage for common records.

Required fields:

- `id`
- `uuid`
- `tenantId`
- `definitionKey`
- `code`
- `name`
- `payload`
- `isActive`
- `createdBy`
- `createdAt`
- `updatedBy`
- `updatedAt`
- `deletedAt`

Rules:

- `tenantId + definitionKey + code` must be unique for active records.
- Soft delete/archive only.
- Payload must be structured JSON.
- Reads must never cross tenant boundaries.

Acceptance:

- CommonList can list, search, filter, create, edit, archive, and restore records.
- Existing CXSUN dynamic master pattern is preserved conceptually without binding CODEXSUN to old implementation details.

### 4. Contact Master Module

Create contact module in core:

- contact profile
- contact type/group
- emails
- phones
- addresses
- social links
- bank accounts
- GST/tax details
- code sequence
- status/archive

Acceptance:

- Contact uses `MasterList`.
- Contact show page displays child blocks consistently.
- Contact upsert page supports nested child blocks.
- No sales, purchase, ledger, payment, or balance logic is added.

### 5. Company Master Module

Create company module in core:

- company profile
- legal/trade name
- addresses
- GST/tax details
- bank accounts
- default contact fields
- logo/file reference only if file foundation is available
- status/archive

Acceptance:

- Company can be reused by all future apps.
- Company fields are not hard-coded to billing only.
- Company UI follows the same MasterList/show/upsert pattern.

### 6. Product Or Item Master Module

Create product/item master foundation:

- item code/name
- group/category/type
- unit
- HSN/tax classification
- brand/colour/size/style attributes
- active/archive

Do not create stock quantity, warehouse stock, valuation, price list, sales rate, purchase rate, GST calculation, or inventory posting in this task.

Acceptance:

- Product/item master can be listed and maintained.
- Entry modules can later reference products without owning the product schema.

### 7. Core API Routes

Expose tenant-scoped routes, mounted under a stable prefix:

```text
GET    /core/common/definitions
GET    /core/common/records?definitionKey=
POST   /core/common/records
GET    /core/common/records/:id
PUT    /core/common/records/:id
POST   /core/common/records/:id/archive
POST   /core/common/records/:id/restore

GET    /core/contacts
POST   /core/contacts
GET    /core/contacts/:id
PUT    /core/contacts/:id
POST   /core/contacts/:id/archive
POST   /core/contacts/:id/restore

GET    /core/companies
POST   /core/companies
GET    /core/companies/:id
PUT    /core/companies/:id
POST   /core/companies/:id/archive
POST   /core/companies/:id/restore

GET    /core/products
POST   /core/products
GET    /core/products/:id
PUT    /core/products/:id
POST   /core/products/:id/archive
POST   /core/products/:id/restore
```

Rules:

- require session
- require tenant context
- require active tenant
- require active core module
- require permissions
- include `correlationId` in response meta and audit
- never replace `x-correlation-id` with `requestId`

### 8. Permissions And Activation

Add permission keys:

```text
core.common.view
core.common.manage
core.contact.view
core.contact.manage
core.company.view
core.company.manage
core.product.view
core.product.manage
```

Add feature/module key:

```text
core
```

Acceptance:

- Core pages hide or disable actions based on permissions.
- APIs reject missing permissions.
- Inactive tenants cannot access core.

### 9. Workspace UI

Use `@codexsun/ui` workspace patterns from Task 5.

Create UI screens:

- Common master overview
- CommonList for simple lookup records
- MasterList for contacts
- MasterList for companies
- MasterList for products/items
- reusable show page sections
- reusable upsert form sections
- popup upsert for simple common records
- dedicated upsert page for contacts, companies, and products

Rules:

- Do not create new local table/list/form systems inside core.
- Add missing UI primitives only inside `@codexsun/ui`.
- Core screens should pass data/schema/actions into reusable workspace components.
- All list, show, and upsert pages must match the approved workspace screenshot visual contract.

Approved list-page visual contract:

- left sidebar stays visible with grouped module navigation
- top bar shows menu button, breadcrumb/app selector, and right-side utility actions
- content width is centered with consistent page gutters
- page header uses title, short muted description, and right-aligned primary actions
- action buttons use icons from the design system
- search/filter/columns controls sit in their own bordered toolbar below the page header
- search input stays left aligned and has a search icon
- filter and columns buttons stay right aligned
- data table is a separate bordered panel below the toolbar
- table header is light, compact, and sortable where applicable
- empty state is centered inside the table body
- pagination is a separate bordered footer panel below the table
- footer shows total count, rows-per-page selector, visible range, previous/current/next controls
- cards are not nested inside cards
- no decorative hero, marketing layout, gradients, or oversized dashboard treatment on list pages
- spacing, border radius, font weight, and muted text must visually match the provided Tenant list screenshot

Approved page patterns:

- `CommonList`: list + show + popup upsert for simple common records
- `MasterList`: list + show + dedicated upsert page for contacts, companies, products, and richer masters
- `EntryList`: list + show/print preview + upsert with sub tables for later transaction apps

Show pages:

- must use the same shell, breadcrumb, title/action row, and compact panel language
- must show detail sections as reusable panels, not custom one-off layouts
- must include back, edit, archive/restore actions where applicable
- child rows such as emails, phones, addresses, banks, and tax details must use reusable section/table blocks

Upsert pages:

- popup upsert is allowed only for simple common records
- dedicated upsert pages are required for masters with nested data
- form sections must use reusable design-system form panels
- action footer must align with the screenshot pattern: secondary cancel/back and primary save on the right
- validation, loading, disabled, and error states must be consistent across modules

Frontend verification:

- compare each implemented module page against the approved screenshot before marking done
- desktop width must match the screenshot rhythm
- mobile/tablet must not overlap text, buttons, side menu, table, or pagination
- if a required UI primitive is missing, add it to `@codexsun/ui` first and then consume it

### 10. Seeds

Add repeatable seeds for safe defaults:

- country: India
- contact types: customer, supplier, transporter, employee, other
- address types: billing, shipping, office, warehouse
- units: pcs, kg, meter, box
- currencies: INR
- payment terms: immediate, 7 days, 15 days, 30 days
- months

Large geography data such as all states/districts/pincodes can be deferred or imported through a later import job.

### 11. Migration Registration

Core migrations must be registered with the existing migration foundation.

Acceptance:

- New tenant setup can apply core migrations.
- Existing tenant activation can apply core migrations.
- Migration status is visible through existing platform migration/admin surfaces.
- Core migration ids are prefixed by `core`.
- Module migration ids include the module key.
- Migrations have a documented forward path and cleanup/rollback note.
- Duplicate table creation is rejected during review.

### 12. Tests

Add focused tests for:

- core route registration
- tenant context required
- tenant mismatch rejected
- inactive tenant rejected
- permission denied
- common definition list
- common record create/list/update/archive/restore
- duplicate code rejection
- contact create/list/show/update/archive/restore
- company create/list/show/update/archive/restore
- product create/list/show/update/archive/restore
- audit includes `correlationId`
- `tenantId` remains separate from correlation tracing

## Documentation Updates

Update:

- `assist/execution/review.md`
- `assist/product/domain-map.md`
- `assist/architecture/module-boundaries.md`
- `assist/architecture/data-strategy.md`
- `assist/governance/api-guidelines.md`
- `assist/documentation/CHANGELOG.md`

Document:

- `core` app ownership
- table ownership decisions
- deferred CXSUN tables
- how future apps consume core modules
- why platform remains separate from core

## Verification Commands

Use `npm.cmd` on Windows:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/platform-api
```

If `apps/core` gets its own test script, also run:

```bash
npm.cmd run test -w @codexsun/core
```

Run framework tests if route/module registration touches framework code:

```bash
npm.cmd run test -w @codexsun/framework
```

## Completion Checklist

- [ ] `apps/core` exists.
- [ ] Core exports can be consumed by platform.
- [ ] Common definition registry exists.
- [ ] Core common records are tenant-scoped.
- [ ] Contacts module exists.
- [ ] Companies module exists.
- [ ] Products/items module exists.
- [ ] Shared address block exists.
- [ ] Shared phone/email block exists.
- [ ] Shared bank block exists.
- [ ] Shared tax identity block exists.
- [ ] Core migrations are registered.
- [ ] Core seeds are repeatable.
- [ ] Core routes are tenant, activation, permission, and audit protected.
- [ ] Core UI uses `@codexsun/ui` workspace components.
- [ ] Simple common records use CommonList and popup upsert.
- [ ] Contacts/companies/products use MasterList and dedicated upsert pages.
- [ ] CXSUN deferred tables are not accidentally imported.
- [ ] Available checks pass.
- [ ] Documentation is updated.

## Completion Criteria

Task 15 is complete only when `core` is the reusable common/master foundation for future apps, not just another platform page group.

The codebase must clearly show:

- platform owns tenant/auth/activation/permissions/runtime mounting
- core owns common/shared/master data
- future business apps depend on core instead of duplicating common tables
- no transaction business logic has entered core
