# Task 14 - Common Master Data Foundation

## Purpose

This is the first task after foundation closure.

The platform is ready for business modules, but the first business-adjacent layer should still be common and reusable. Task 14 creates the master data foundation used by future contacts, items, billing, accounting, inventory, POS, compliance, and industry packs.

Do not build full billing, accounting, inventory, POS, GST filing, offline sync, or industry-specific workflows in this task.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_14` |
| Status | `planned` |
| Depends on | Foundation review says ready |
| Focus | Common master data contracts, APIs, UI templates, and reusable patterns |
| Last updated | `2026-06-29` |

## Goal

Create a reusable common master data layer for tenant business modules:

- master data definition registry
- common lookup records
- contacts foundation
- address foundation
- item/category/unit/tax placeholders
- tenant-scoped APIs
- list/show/upsert UI using Task 5 workspace patterns
- import/export-ready contracts
- audit and permission integration

## Required Context

Read before implementing:

- `assist/execution/review.md`
- `assist/README.md`
- `assist/product/domain-map.md`
- `assist/product/product-scope.md`
- `assist/architecture/tenant-isolation.md`
- `assist/architecture/data-strategy.md`
- `assist/governance/api-guidelines.md`
- `assist/governance/testing-strategy.md`
- `packages/ui/src/workspace`
- `packages/platform/src/tenant`
- `packages/platform/src/permissions`
- `packages/platform/src/activation`

## Module Boundary

Preferred ownership:

```text
packages/platform/src/master-data/
apps/platform/api/src/master-data/
apps/platform/web/src/pages/tenant/master-data/
```

If the codebase has or needs a future business package, keep the platform-owned part limited to shared contracts and route guards. Do not put industry-specific rules into platform.

## Work Scope

### 1. Master Data Definition Registry

Create a registry for reusable master data definitions:

- contact types
- contact groups
- address types
- countries
- states
- districts
- cities
- pincodes
- item categories
- units
- tax categories

Definition fields:

- `definitionKey`
- `label`
- `description`
- `scope`
- `status`
- `requiredPermission`
- `requiredFeature`
- `fields`
- `seedable`

Acceptance:

- Definitions are data-driven.
- Future modules can register more definitions.
- No industry-specific behavior is hard-coded.

### 2. Tenant-Scoped Master Records

Create common record contracts:

- `recordId`
- `tenantId`
- `definitionKey`
- `code`
- `name`
- `status`
- `payload`
- `createdBy`
- `createdAt`
- `updatedBy`
- `updatedAt`
- `deletedAt`

Rules:

- All records are tenant-scoped.
- Soft delete/archive only.
- `definitionKey + code` should be unique per tenant.
- Payload must be structured JSON, not arbitrary string blobs.

Acceptance:

- APIs cannot read/write master records without tenant context.
- Tenant mismatch is rejected.
- Archive/restore behavior is audited.

### 3. Contact Foundation

Create reusable contact contracts without full sales/purchase behavior:

- contact profile
- contact type
- phone list
- email list
- address list
- GSTIN/tax identity placeholders
- bank account placeholders
- notes
- status

Do not build customer/vendor ledger posting, receivables, payables, or sales rules yet.

Acceptance:

- Contact can be listed, shown, created, updated, archived, and restored.
- Contact UI uses `MasterList` and `MasterUpsertPage`.
- Contact detail is ready for future billing/accounting modules.

### 4. Address Foundation

Create address model:

- address line 1
- address line 2
- country
- state
- district
- city
- pincode
- GST state code placeholder
- default flag
- address type

Acceptance:

- Address sub-form is reusable.
- Address lookup data comes from common master records.

### 5. Item And Unit Placeholders

Create only foundation definitions and UI placeholder routes for:

- item categories
- units
- tax categories

Do not build stock quantity, pricing, GST calculation, inventory valuation, or accounting posting yet.

Acceptance:

- Future item module has reusable base definitions.
- UI shows coming-soon/definition-backed screens, not fake business logic.

### 6. API Routes

Add tenant-scoped routes:

```text
GET    /master-data/definitions
GET    /master-data/records?definitionKey=
POST   /master-data/records
GET    /master-data/records/:id
PUT    /master-data/records/:id
POST   /master-data/records/:id/archive
POST   /master-data/records/:id/restore

GET    /contacts
POST   /contacts
GET    /contacts/:id
PUT    /contacts/:id
POST   /contacts/:id/archive
POST   /contacts/:id/restore
```

Rules:

- Require session.
- Require tenant match.
- Require active tenant.
- Require feature enabled: `business.master-data`.
- Require permissions:
  - `business.master-data.view`
  - `business.master-data.manage`
  - `business.contact.view`
  - `business.contact.manage`
- Include `correlationId` in responses and audit.

### 7. UI Screens

Use Task 5 workspace patterns.

Create tenant desk pages:

- Master Data overview.
- Common record list/show/upsert.
- Contact list/show/upsert.
- Address sub-form component.
- Coming-soon pages for item categories, units, and tax categories if data APIs are not fully wired.

Required UX:

- `MasterList` for contacts.
- `CommonList` for simple lookup records.
- Dedicated upsert page for contacts.
- Dialog upsert can be used for simple lookup records.
- No business-specific dashboard cards yet.

### 8. Seeds

Seed safe defaults per tenant where useful:

- countries: India
- common states can be deferred if too large
- contact types: customer, supplier, transporter, employee, other
- address types: billing, shipping, office, warehouse
- units: pcs, kg, meter, box

Seeds must be repeatable.

### 9. Audit And Activity

Audit:

- create record
- update record
- archive record
- restore record
- create contact
- update contact
- archive contact
- restore contact

Activity:

- optional contact activity timeline using existing activity foundation.

### 10. Tests

Add tests for:

- tenant context required.
- tenant mismatch rejected.
- permission denied.
- definition list returns expected defaults.
- create/list/update/archive/restore common record.
- create/list/update/archive/restore contact.
- duplicate code rejected.
- soft-deleted records do not appear in active list by default.
- audit event includes `correlationId`.

## Out Of Scope

- Billing invoices.
- Accounting ledgers/vouchers.
- Stock movements.
- Inventory valuation.
- GST calculation.
- E-invoice/e-way bill.
- Offline sync.
- Import/export jobs.
- Industry-specific contact fields beyond payload extension support.

## Verification Commands

Use `npm.cmd` on Windows:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/platform-api
```

Run framework tests only if framework files change:

```bash
npm.cmd run test -w @codexsun/framework
```

## Documentation

Update after implementation:

- `assist/product/domain-map.md`
- `assist/architecture/module-boundaries.md`
- `assist/architecture/data-strategy.md`
- `assist/governance/api-guidelines.md`
- `assist/documentation/CHANGELOG.md`

## Completion Criteria

- Master data definitions exist.
- Tenant-scoped master records exist.
- Contact foundation exists.
- Address sub-form exists.
- APIs enforce tenant, permission, activation, and audit rules.
- UI uses reusable workspace patterns.
- Available checks pass.
- No billing/accounting/inventory business logic is introduced.
