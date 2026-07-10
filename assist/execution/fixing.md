# Core Common and Master Fixing Plan

Status: audit complete on 2026-07-10. No remediation in this checklist has been implemented yet.

## Phase 0 - Audit and Scope

- [x] P0 - Audit Common and Master backend, frontend, routes, persistence, tenant handling, and tests.
- [x] P0 - Confirm the current module map: Common location plus 24 catalog modules; Master contact, product, work order, and Organisation-owned company.
- [x] P0 - Keep Company owned by Core Organisation and expose it in the Billing Master navigation.

## Phase 1 - Correctness and Data Safety

- [x] P0 - Show the Organisation-owned Company workspace with Contact, Product, and Work Order in the Billing Master menu.
- [x] P0 - Add Company Logo and Logo Dark SVG uploads, store them as `storage/{tenant}/logo/logo.svg` and `storage/{tenant}/logo/logo-dark.svg`, and persist both paths on the Company record.
- [ ] P0 - Align Company routes with the Master contract: list, get, create, update, activate, deactivate, and force delete.
- [ ] P0 - Remove or redirect the duplicate Organisation/Company navigation and route aliases after the target ownership is selected.
- [ ] P0 - Enforce the location relationship chain on create and update: country -> state -> district -> city.
- [ ] P0 - Validate that each supplied parent location exists and is visible to the active tenant before saving a child location.
- [ ] P0 - Prevent global location deletion when any tenant-level record references that global location.
- [ ] P0 - Add database foreign keys where compatible with the global-reference model, or enforce the same rules in a single transaction when foreign keys are not viable.
- [ ] P0 - Choose one authoritative Master child-data store: normalized child tables or parent JSON columns.
- [ ] P0 - Make Master parent and child writes transactional.
- [ ] P0 - Delete Master child rows when force-deleting the parent, with database cascade protection where applicable.

## Phase 2 - Tenant Boundaries and API Contract

- [ ] P1 - Resolve tenant identity from authenticated server context instead of trusting client-controlled headers or query parameters.
- [ ] P1 - Remove `tenantId` query-string tenant selection from Location endpoints unless it is restricted to an authorized platform-admin flow.
- [ ] P1 - Standardize tenant resolution, response metadata, and error envelopes across Common, Location, Master, and Company.
- [ ] P1 - Standardize record status semantics: use one canonical active/status representation across Common, Location, and Master.
- [ ] P1 - Add tenant-scoped uniqueness rules for each Common module's business key or name according to its definition.
- [ ] P1 - Add Master uniqueness and validation rules for code, identifiers, GSTIN/PAN where required, and primary email/phone consistency.

## Phase 3 - Module Ownership and Duplication

- [ ] P1 - Decide whether Common modules may share a generic CRUD engine while retaining individual schemas and behavior contracts.
- [ ] P1 - Move module-specific validation, lookup rules, seed policy, and deletion policy into each Common module definition or service boundary.
- [ ] P1 - Consolidate backend and frontend Common definitions from a shared source or contract-generation layer to prevent drift.
- [ ] P1 - Remove thin compatibility wrappers that no longer serve routing or migration compatibility.
- [ ] P1 - Resolve the duplicate Company wrappers under `master/company` and `organisation/company`.
- [ ] P1 - Remove or repair the misleading `master.list.tsx` component that always renders Company.
- [ ] P1 - Consolidate Work Order's bespoke workspace with the generic Master shell, or document and test the intended behavioral differences.

## Phase 4 - Performance and Operations

- [ ] P2 - Add server-side pagination, filtering, and bounded lookup endpoints for Common, Location, and Master lists.
- [ ] P2 - Avoid returning all Master child JSON on list views; load detail children only when opening a record.
- [ ] P2 - Batch or cache Master lookup requests and filter dependent lookups by selected parent location.
- [ ] P2 - Replace startup-wide schema introspection with versioned migrations run through a controlled migration command or migration ledger.
- [ ] P2 - Keep seed execution idempotent but move it out of every production API startup.
- [ ] P2 - Measure list latency and startup migration time after the contract/data fixes are complete.

## Phase 5 - Verification

- [ ] P0 - Add database route tests for Company, Contact, Product, and Work Order CRUD, activation, deletion, tenant isolation, and global-record protection.
- [ ] P0 - Add database tests for Master child rows, transaction rollback, child cleanup, and primary email/phone derivation.
- [ ] P0 - Add location tests for invalid/mismatched parent chains and global-reference deletion across multiple tenants.
- [ ] P1 - Add API contract tests covering uniform envelopes, errors, active/status behavior, and tenant resolution.
- [ ] P1 - Add browser e2e coverage for Billing > Master navigation, Company actions, Common popup upserts, inline lookup creation, and persisted reads.
- [ ] P2 - Run type checks, lint, package builds, API e2e, and browser e2e after each phase; record outcomes here.

## Completion Gate

- [ ] P0 - All Phase 1 correctness and data-safety items are complete and passing automated tests.
- [ ] P1 - All Phase 2 contract and tenancy items are complete and passing automated tests.
- [ ] P1 - The Billing Master menu exposes Company, Contact, Product, and Work Order consistently.
- [ ] P2 - Performance baselines are captured and no known startup or list-loading regression remains.
