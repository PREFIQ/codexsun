# Changelog

## Version State

Current version: 1.0.31

Release tag: v-1.0.31

Changelog label: v 1.0.31

This changelog starts fresh from the cleaned CODEXSUN foundation. Earlier copied application history was intentionally removed because it did not represent the current workspace.

New entries should keep database-facing work and application code work separate.

#### Database Changes

Records schema, migration, seed, tenant provisioning, and data compatibility changes.

#### App Codebase Changes

Records UI, API, service logic, tooling, packaging, and documentation changes.

## v-1.0.31

### [v 1.0.31] 2026-07-14 11:08 am - Minimal Billing Draft and Default Reference Fixes

#### Database Changes

- Database update: Yes (manual).
- Updated the Product seed so the protected `-` product resolves its Product Type, Product Category, HSN Code, Unit, and GST Tax foreign IDs from the existing `-` records, falling back to the first active persisted record without creating anonymous masters.
- Updated the Contact seed to resolve the demo contact's persisted Contact Type and Contact Group and to backfill one default `-` address for every active contact that has no address, using the connected seeded Country -> State -> District -> City -> Pincode hierarchy.
- Existing tenant databases require the normal repeatable Core seed pass to receive the Product relationship repair and missing-address backfill; no new table or schema migration is required.

#### App Codebase Changes

- Fixed Quotation, Sales, Purchase, and Export Sales quick-product requests so persisted Product Category, HSN Code, Unit, and GST Tax IDs are submitted as numeric foreign IDs instead of invalid strings.
- Expanded the Core Product response with its resolved type, category, HSN, unit, and GST tax relationship values and made minimal product creation reuse the existing fallback masters.
- Added default-address enrichment to minimal Contact creation so inline contacts created without address details still return a persisted address owned by that contact.
- Allowed contact-only draft creation for Quotation, Sales, Purchase, and Export Sales and zero-value draft creation for Receipt and Payment while preserving line-item requirements for confirmation and positive-total requirements for posting.
- Added fallback Ledger and Work Order resolution for minimal Billing drafts and fallback cash/bank Ledger resolution for Receipt and Payment without creating placeholder business records.
- Extended the tenant-isolated persistence E2E to cover minimal Product and Contact creation, all six minimal Billing draft flows, default foreign-reference resolution, cleanup, and rejection of empty confirmation/posting actions.
- Bumped workspace version to 1.0.31.

## v-1.0.30

### [v 1.0.30] 2026-07-13 11:22 pm - Fresh Database Startup Verification

#### Database Changes

- Database update: Yes (manual).
- Verified migration preflight against the freshly reinstalled `cxsun_master_db` and its registered `codexsun_db` tenant target with no missing or invalid database mapping.
- Ran the complete Platform -> Core -> Billing migration stack successfully and confirmed one applied master migration plus all 19 tenant migration markers, including the five tenant access-control owners and the seven Billing foundations.
- Ran the live seed stack twice without duplicate records or failures, confirming repeatable app-registry, default tenant, domain, subscription, tenant-module, Core, and Billing seed behavior.
- Verified the disposable fresh-start and restart path produces identical persisted state: three platform apps, two plans, one tenant/domain/subscription, two tenant module settings, one `codexsun` company, one current financial year, one default-company setting, one demo supplier, one Billing setting, and all seven Billing root tables.
- Confirmed the default-company seed resolves the first `codexsun` company and current financial year through persisted database identities after a clean installation.

#### App Codebase Changes

- Added independently owned tenant User, Role, Permission, User Role, and Role Permission backend/frontend modules with tenant-bound authorization, migrations, seeders, lifecycle APIs, application-desk pages, and Access Control sidebar composition.
- Added mutation confirmations, success/error notifications, API-aware automatic list return, protected-record handling, and password masking across the tenant access workspaces.
- Split application routes and tenant business workspaces into lazy production chunks; the tenant desk entry chunk decreased from 801.95 kB (139.64 kB gzip) to 37.33 kB (8.80 kB gzip).
- Verified the fresh database startup with `db:migrations:preflight`, `db:migrations:run`, two `db:seed` passes, migration-ledger inspection, and the restart-safe Platform/Core/Billing bootstrap E2E.
- Bumped workspace version to 1.0.30.

## v-1.0.29

### [v 1.0.29] 2026-07-13 4:48 pm - working on sales

#### Database Changes

- Database update: Yes (auto-check).

#### App Codebase Changes

- Bumped workspace version to 1.0.29.

## v-1.0.28

### [v 1.0.28] 2026-07-13 9:52 am - Common List Serial Columns

#### Database Changes

- Database update: Yes (manual).
- Consolidated the fresh Contact migration around the Contact master and its five owned child tables: emails, phones, addresses, bank accounts, and social links.
- Added concrete foreign keys for Contact type/group, address type, location hierarchy, and bank-name references; existing databases require the normal fresh migration path to receive the consolidated schema exactly.

#### App Codebase Changes

- Standardized all 29 Core Common frontend lists so the module-owned `sortOrder` field appears first as a centered `#` serial column with a fixed 64 px width and tabular numeric alignment.
- Preserved strict leaf ownership by keeping the serial-column definition inside each Common list rather than introducing shared or centralized business-column configuration.
- Refactored Core Master Contact into a complete module-owned backend and frontend implementation with exact migration, repository, service, routes, seed, types, list, form, hooks, services, workspace, and index responsibilities.
- Added the animated `Details`, `Tax Details`, `Communication`, `Addresses`, `Finance`, and `More` Contact form tabs with repeatable emails, phones, addresses, bank accounts, and social links.
- Wired Contact Type, Contact Group, Address Type, Bank Name, Country, State, District, City, and Pincode as searchable foreign-reference lookups with in-context creation and dependent location filtering.
- Replaced Contact child JSON read behavior with transactional persistence and hydration through the five Contact-owned child tables, including parent-reference and location-hierarchy validation.
- Verified Contact create-and-read persistence against a disposable freshly migrated tenant database, including one persisted row in every Contact child table.
- Fixed Contact address persistence so a selected country or postal code is retained even when the optional Address line 1 is empty; changing country now persists the new country while clearing stale State, District, City, and Postal Code references in sequence.
- Replaced the India-only six-digit Pincode validation with an international 2-20 character postal-code contract supporting letters, numbers, spaces, and hyphens in both the Common Pincode owner and Contact lookup creation popup.
- Moved Contact next-code generation to the Contact backend using all persisted codes, recognizing both `C-0000` and legacy `C_0001` sequences while returning the canonical next `C-####` value independently of frontend search filters.
- Aligned the Contact postal-code creation popup with the Common Country upsert tone using a compact dialog width, padded header and fields, descriptive copy, footer divider, and consistent primary/cancel action spacing.
- Replaced Product's raw Product Type, Product Category, HSN Code, Unit, and GST Tax ID inputs with Product-owned autocomplete lookups, fixed Common relationship endpoints, create-and-select flows, active-reference validation, and persisted numeric foreign IDs.
- Bumped workspace version to 1.0.28.

## v-1.0.27

### [v 1.0.27] 2026-07-13 8:35 am - rework on core

#### Database Changes

- Database update: Yes (auto-check).

#### App Codebase Changes

- Bumped workspace version to 1.0.27.

## v-1.0.26

### [v 1.0.26] 2026-07-13 1:31 am - Root npm Workspace and Repository Cleanup

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Standardized the monorepo on npm workspaces with one root `node_modules`, one root `package-lock.json`, and no pnpm or Yarn lockfiles, stores, or workspace-local dependency trees.
- Standardized generated build output on the root `dist` tree and removed nested `node_modules`, `dist`, and `dist-types` artifacts and local output configuration.
- Added mandatory Assist governance and agent rules requiring npm commands to run from the repository root and requiring `npm run dependencies:check` plus nested-artifact scanning after dependency, workspace, package, or build changes.
- Removed generated Codex runtime logs, audit output, Turbo and IDE caches, automated test/spec/E2E sources, Playwright configuration, test-runner scripts and dependencies, and the Framework test-only export.
- Updated the module-boundary checker so production module ownership validation no longer requires removed test/spec role files.
- Verified the cleaned repository with npm dependency-tree validation, root dependency-layout validation, Prettier, ESLint, and TypeScript.
- Bumped workspace version to 1.0.26.

## v-1.0.25

### [v 1.0.25] 2026-07-12 10:17 pm - Common Module Boundary and Location Hierarchy

#### Database Changes

- Database update: Yes (manual).
- Rebuilt the Core location foundation migrations as independent Country, State, District, City, and Pincode tables with ordered foreign keys and relationship-safe delete restrictions.
- Added scoped uniqueness for State per Country, District per State, City per District, and Pincode per City.
- Moved Country, Indian State and territory, Tamil Nadu District and City, and supported Pincode seed records into their owning modules with deterministic, idempotent upserts.
- Preserved the ordered Country -> State -> District -> City -> Pincode migration and seed sequence.
- Removed redundant `tenant_id` columns and tenant-scoped indexes from all 24 non-location Core Common master migrations; the selected tenant database is now the sole data-isolation boundary.
- Changed Common master uniqueness from `(tenant_id, primary field)` to database-local primary-field uniqueness and removed tenant prefixes from generated record IDs.
- Existing development databases created from the earlier Common schema require the fresh migration workflow to physically rebuild the tables without legacy `tenant_id` columns.
- Fixed invalid trailing commas after the final unique key in all 24 non-location Common table migrations and quoted the Month `from_date` and `to_date` identifiers for MariaDB compatibility.

#### App Codebase Changes

- Refactored all 29 Core Common leaf modules to the reduced nine-file backend contract: migration, module, repository, routes, seed, service, test, types, and index.
- Replaced all 24 generic Common master wrappers with module-owned migrations, typed records and payloads, direct SQL repositories, validation services, Fastify routes, lifecycle behavior, seeds, and contract tests.
- Removed the Common master definition registry and the shared migration, repository, route, seed, service, context, and type factories; no Common leaf module extends, aliases, or delegates its backend behavior to a generic foundation.
- Removed separate definition, event, sync, and worker placeholder files while preserving each module's fields, protected placeholder rows, seed values, routes, lifecycle behavior, and table ownership.
- Removed Common-level `x-tenant-id` parsing, logical global/tenant row filtering, tenant parameters, and `tenantId` response fields; Common requests now rely exclusively on the fail-closed `x-tenant-db` database context.
- Replaced the former shared location backend with independently owned Country, State, District, City, and Pincode repositories, services, routes, contracts, migrations, seeds, and tests.
- Added normalized Country, State, District, and City relationship joins and parent validation throughout the location hierarchy.
- Added separate Pincode individual and relation endpoints; relation reads return the complete City, District, State, and Country hierarchy.
- Removed obsolete shared location helpers, shared seed data, and the stale legacy location database test that targeted the deleted global/tenant location contract.
- Formatted the complete Core Common backend and verified it with Prettier, ESLint, TypeScript, and Core API tests.
- Rebuilt all 29 Core Common frontend leaf modules as independently owned nine-file bundles: workspace, list, form, services, hooks, schema, types, spec, and index.
- Standardized Contact, Product, Workorder, Other, and Location masters on the Contact Types interaction tone with searchable paginated lists, popup upsert forms, active-state controls, edit, suspend/restore, and force-delete row actions.
- Wired every frontend leaf directly to its owning Core API route through the fail-closed `x-tenant-db` context and removed frontend `tenantId` and `x-tenant-id` handling.
- Consolidated module definitions into each leaf's owned types file and removed the unused shared Location frontend runtime; Common leaf modules no longer borrow or wrap the legacy Common Master or Location implementations.
- Verified the complete Core Common frontend with Prettier, ESLint, TypeScript, 30 passing module specs, a production build, and browser-level Country list and popup-upsert checks.
- Verified the corrected Common migrations through a real configured-database Core API bootstrap through `app.ready` and `server.listen`.
- Added a disposable MariaDB Common E2E regression covering create, restart persistence, read, update, suspend, restore, force delete, response request metadata, and the complete Pincode-to-City-to-District-to-State-to-Country relation read.
- Standardized every Core-owned table primary key on `id INT NOT NULL AUTO_INCREMENT PRIMARY KEY`, including all Common, Location, Master, Organisation Company, and Master child tables.
- Removed persisted and API-facing UUID columns from the complete Core schema and converted Core foreign-key and lookup ID columns to integers.
- Updated Core API repositories, seeds, services, events, sync contracts, Core Web modules, and Platform tenant-desk consumers for numeric record IDs while retaining string conversion only at URL, form-control, and local-storage boundaries.
- Extended disposable MariaDB E2E coverage to assert that every Core table has an integer auto-increment ID, no Core table contains a UUID column, Master child rows receive numeric IDs, relations remain valid, and tenant isolation still passes.
- This is a destructive development-schema change: databases created with string IDs or UUID columns must use the documented fresh migration workflow; existing IDs are not automatically remapped.
- Replaced every Core `is_active TINYINT(1)` persistence column with `status VARCHAR(24) NOT NULL DEFAULT 'active'`, including 24 non-location Common masters and Master social-link child tables.
- Removed the duplicate Master/Company `is_active` column, standardized its existing status column from `VARCHAR(32)` to `VARCHAR(24)`, and changed its tenant-state index to use status.
- Preserved the existing frontend `isActive` interaction contract by translating it to `active`/`inactive` status values in Core repositories; Master suspension continues to persist the explicit `suspend` status.
- Extended MariaDB schema E2E assertions to reject any remaining Core `is_active` column and any status column that is not `VARCHAR(24)` with the `active` default.
- Renamed the Month persistence and application contract from `from_date`/`to_date` and `fromDate`/`toDate` to `start_date`/`end_date` and `startDate`/`endDate`, including seeds, validation, repositories, frontend fields, and labels.
- Removed the unused top-level Core Common sync policy and worker placeholder files after confirming they had no executable imports or exports.
- Corrected the generic Master child-table migration so only Companies and Contacts own address, bank-account, email, phone, and social-link tables.
- Removed obsolete `products_*` and `work_orders_*` contact-detail child tables, stopped child synchronization for Product and Work Order records, and normalized any supplied contact-detail payloads to empty collections.
- Added MariaDB schema assertions requiring all ten Company/Contact child tables while rejecting every Product/Work Order contact-detail child table.
- Bumped workspace version to 1.0.25.

## v-1.0.24

### [v 1.0.24] 2026-07-12 7:34 pm - reworking on full app

#### Database Changes

- Database update: Yes (auto-check).

#### App Codebase Changes

- Bumped workspace version to 1.0.24.

## v-1.0.23

### [v 1.0.23] 2026-07-12 11:12 am - working on migration

#### Database Changes

- Database update: Yes (auto-check).

#### App Codebase Changes

- Bumped workspace version to 1.0.23.

## v-1.0.22

### [v 1.0.22] 2026-07-11 7:05 pm - Super Admin App Operations Experience

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Reworked the Super Admin repository app strip into a fixed responsive five-column grid with automatic wrapping and no horizontal scrollbar.
- Added distinct light pastel gradients, coordinated icon treatments, soft borders, and corner-white glow effects for each repository app card.
- Applied the selected app's visual identity to the App Operations hero while keeping operational controls and status information clear.
- Added low-intensity app-matched gradients to service metrics without changing service-list or supporting-panel surfaces.
- Preserved responsive layouts, dark-mode variants, hover feedback, and status-badge contrast across the updated operations experience.
- Verified the Platform web application with focused formatting, TypeScript checks, and repository diff validation.
- Bumped workspace version to 1.0.22.

## v-1.0.21

### [v 1.0.21] 2026-07-11 5:42 pm - Data Bridge Foundation and Super Admin Desk

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Added the isolated `apps/data-bridge` API and web application bundles with dedicated ports, workspace packages, development stack, environment configuration, and build tooling.
- Added the Data Bridge controlled migration workflow for discovery, mapping, review, approval, execution, and reconciliation across schema-upgrade and data-transfer tracks.
- Defined the required Data Bridge areas: Overview, Migration Projects, Connections & Secrets, Discovery Snapshots, Schema Comparison, Mappings & Transforms, Review & Approvals, Execution Runs, and Reconciliation & Audit.
- Added fail-closed execution guards requiring tenant context, approved project status, a successful dry run, an approval reference, and an immutable plan checksum.
- Added Data Bridge to the Super Admin app switcher and exposed it through the authenticated `/data-bridge` desk with its own sidebar and workspace shell.
- Removed the earlier embedded Data Bridge entry from the Super Admin Database menu.
- Removed the redundant page-title breadcrumb segment from the Super Admin top bar.
- Restricted the Super Admin and Data Bridge app switchers to Platform and Data Bridge so tenant Application and Staff desks cannot be entered from this context.
- Added Data Bridge architecture, security, module-boundary, runtime, and verification documentation.
- Verified the Data Bridge API, Data Bridge web, shared UI, and Platform web with focused typechecks, API safety tests, browser interaction checks, and design QA.
- Added the isolated KitchenServe API and web app on ports `7110` and `7120`, supported by Platform, Core, Framework, and UI without Billing or Accounts dependencies.
- Added the tenant-scoped waiter-order lifecycle from draft capture through kitchen submission, preparation, ready-to-serve, served, bill-waiting, and closed states.
- Added real MariaDB persistence for KitchenServe orders, order items, and station-specific kitchen tickets with transactional order creation and validated tenant database selection.
- Added KitchenServe desks for floor and tables, menu, waiter orders, kitchen display, ready-to-serve, bill waiting, order history, and settings.
- Replaced the Super Admin overview dashboard cards with a compact live strip for every runnable repository app.
- Added App Operations maintenance pages with service availability, port response time, managed uptime, terminal PID, and per-service health metrics.
- Added guarded Open & start, Stop, Update, and Refresh controls; app starts and updates open in new visible terminals while stop is limited to process trees recorded by the orchestrator.
- Added independent Start, Stop, and Restart controls for every API/Web service with service-specific PID and uptime ownership.
- Enlarged repository app and metric cards with mild theme-token gradients, stronger icon treatment, and improved hover elevation.
- Reworked the repository app strip into a fixed responsive grid with five cards per wide row, automatic wrapping, no horizontal scrollbar, and a distinct theme-token color treatment for each app.
- Bumped workspace version to 1.0.21.

## v-1.0.20

### [v 1.0.20] 2026-07-11 5:15 pm - working on platform registry

#### Database Changes

- Database update: No (auto-check).

#### App Codebase Changes

- Bumped workspace version to 1.0.20.

## v-1.0.19

### [v 1.0.19] 11/07/2026 11:10 am - Task Manager Todo editor and workflow improvements

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added a module-owned minimal Todo rich-text editor with essential formatting controls, clean list previews, and shared workspace styling.
- Bumped workspace version to 1.0.19.

## v-1.0.18

### [v 1.0.18] 2026-07-11 9:54 am - working on eway and einvoice

#### Database Changes

- Database update: Yes (auto-check).

#### App Codebase Changes

- Bumped workspace version to 1.0.18.
- Added shadcn Typeset, Geist Variable, and Geist Mono typography assets to the shared UI stylesheet.
- Applied the `typeset typeset-article` preset to the Workspace Editor rich-content preview, replacing its previous `prose` styling.

## v-1.0.17

### [v 1.0.17] 2026-07-11 12:33 am - Independent export sales clone

#### Database Changes

- Database update: Yes (manual).
- Wired the Export Sales migration into tenant billing database bootstrap and added the Export Sales lookup routes.

#### App Codebase Changes

- Refactored Export Sales into an independent clone of the Quotation/Sales workspace with matching list, upsert, item entry, autocomplete, totals, show, activity tools, and print preview flows.
- Added Export Sales revoke/delete workflow parity, validation handling, and deferred accounting posting behavior.
- Bumped the workspace version to 1.0.17.

## v-1.0.16

### [v 1.0.16] 2026-07-10 11:22 pm - Contact legal name magic autofill

#### Database Changes

- Database update: No (auto-check).

#### App Codebase Changes

- Bumped workspace version to 1.0.16.

## v-1.0.15

### [v 1.0.15] 2026-07-10 10:55 pm - Independent sales module clone

#### Database Changes

- Database update: Yes (manual).
- Added sales migration fields for tax type, work order, sales ledger, terms, and GST split values.
- Added the Sales-owned Core lookup proxy for contacts, addresses, products, categories, HSN codes, units, taxes, colours, sizes, and work orders.

#### App Codebase Changes

- Cloned the quotation list, upsert, show, print preview, and print route into independent Sales-owned UI code.
- Added Sales item entry with product autocomplete, inline lookup creation, tax-aware CGST + SGST or IGST columns, totals, and round-off controls.
- Added Sales contact and address autocomplete flows with editable billing and shipping address dialogs.
- Added Sales comments, activity timeline, entry tools, print copies, navigation, status actions, and save toasts.
- Removed the older Sales form/list implementation from the active module exports so the cloned Sales workflow is the only owned frontend path.
- Bumped the workspace version to 1.0.15.

## v-1.0.14

### [v 1.0.14] 2026-07-10 10:02 pm - Quotation save, submit, revoke, and edit controls

#### Database Changes

- Database update: Yes (auto-check).
- No quotation database schema changes were introduced by this work.

#### App Codebase Changes

- Added separate Save and save-action dropdown controls for saving drafts, submitting quotations, and admin revoke.
- Added draft/submitted workflow handling with revoke support for eligible non-invoiced quotations.
- Locked quotation editing after submission for regular users and kept invoiced quotations protected.
- Added fixed footer New quotation navigation for starting a fresh quotation without leaving the workspace.
- Bumped workspace version to 1.0.14.

## v-1.0.13

### [v 1.0.13] 2026-07-10 3:41 pm - Quotation Contact Quick Upsert

#### Database Changes

- Database update: Yes (manual).
- No database schema changes. The quotation lookup proxy creates and updates existing Core contact records.

#### App Codebase Changes

- Added a contact-only quick upsert dialog to the Quotation customer lookup with name, legal name, phone, email, and address lines.
- A missing contact search now offers New contact; saving silently refreshes the lookup and selects the created contact.
- Selected contacts show an arrow edit control in place of the lookup chevron; saving refreshes and retains the edited contact selection.
- Added Billing API proxy routes for Quotation contact create/update so browser traffic remains within the Billing module boundary.
- Split quick contact upsert into Details and Address tabs, added GSTIN and Address Type, and made State, District, City, and Pincode dependent lookup/create controls with India as the hidden default country.
- Widened the contact dialog, changed the fast-entry fields to a single-column flow, removed Email from the form, and made Address Type a create-capable autocomplete.
- Added Quotation-owned create/edit lookup popups for Products and Work Orders, inline Colour and Size creation, and an Items tab that contains both quotation lines and totals without the former tab-area divider.
- Bumped workspace version to 1.0.13.

## v-1.0.12

### [v 1.0.12] 2026-07-10 3:27 pm - Quotation Module Consolidation

#### Database Changes

- Database update: Yes (manual).
- Stopped the legacy Entries migration from creating new quotation entry tables. Existing legacy tables are retained for non-destructive upgrades.

#### App Codebase Changes

- Removed the duplicate Entries quotation routes, conversion endpoint, renderer, types, and its obsolete database test.
- Made `billing/quotation` the single quotation workflow, including conversion to a Sales invoice and storing the generated invoice number on the quotation.
- Added draft-only edit/confirm guardrails, cancellation rules, duplicate-number validation, and deterministic configured numbering for new quotations.
- Published quotation domain events and enqueued workflow jobs for create, update, confirm, cancel, and conversion actions.
- Added a Billing-owned Core lookup proxy for contacts, work orders, products, colours, and sizes; the Quotation browser UI no longer calls Core directly.
- Removed unused quotation form/list duplicates and added Quotation service regression tests for numbering, lifecycle, conversion, events, and queue jobs.
- Bumped workspace version to 1.0.12.

## v-1.0.11

### [v 1.0.11] 2026-07-10 2:23 pm - Quotation item table polish

#### Database Changes

- Database update: No (manual).

#### App Codebase Changes

- Bumped workspace version to 1.0.11.

## v-1.0.10

### [v 1.0.10] 2026-07-10 12:00 pm - Core Work Order Module Ownership

#### Database Changes

- Database update: Yes (manual).
- Added the protected Work Order placeholder seed (`WO-0000`) for `work_orders`.
- Aligned master-record protection so global and placeholder records are blocked consistently in update, status, and force-delete flows.

#### App Codebase Changes

- Moved Work Order out of the shared master workspace/list wrappers into module-owned `work-order` workspace, list, form, hooks, services, and definition files.
- Flattened the Work Order form into one owned panel and removed inherited Contact/Product tabs.
- Removed Contact lookup and Contact list column from Work Order so the module no longer feels coupled to Contact master behavior.
- Kept Work Order name and code as edit links for editable rows while protected rows render plain text with the protected indicator.
- Removed Work Order-specific branches from the shared master workspace so future Contact/Product changes do not bleed into Work Order.
- Verified the refactor with Core Web and Platform Web type checks.
- Bumped workspace version to 1.0.10.

## v-1.0.9

### [v 1.0.9] 2026-07-09 7:53 pm - Billing Settings and Quotation Workflow

#### Database Changes

- Database update: Yes (manual).
- Preserved operator-configured tenant app access during default-tenant boot seeding instead of replacing it with seed defaults.
- Synchronized tenant module settings so disabled and enabled app records remain accurate after provisioning and restart.
- Extended tenant billing settings JSON with shared layout, printing, customisation, feature, and document-numbering defaults.
- Added backward-compatible normalization for legacy per-document layouts and removed obsolete hidden feature and totals settings.
- Added tenant-scoped automatic numbering profiles for Sales, Quotation, Purchase, and Export Sales.

#### App Codebase Changes

- Added development-only CODEXSUN tenant auto-login controlled by `.env`, using the normal server-side credential verification and session flow.
- Added Billing API to the Platform development stack and verified Billing Settings startup, CORS, and tenant database loading.
- Rebuilt Billing Settings with shared global PO, DC, Colour, Size, E-invoice, and E-way controls for Quotation, Sales, and Purchase.
- Added persisted Printing controls, custom terms, live letterhead preview/designer, document titles, print language, and focused feature switches for Quotation, Export Sales, and TConnect.
- Added a Document Settings workspace with automatic mode, prefix, separator, suffix, next number, padding, and live previews.
- Connected automatic numbering to Sales and Quotation creation and advanced counters only after successful saves.
- Reshaped Quotation entry with header tabs, Details, Other Details, Address, and Terms sections; removed Quotation E-way and E-invoice tabs.
- Reordered Quotation details into customer/work-order and number/date/tax columns, moved item entry into Details, aligned totals right, and added Save, Save & Print, and Cancel footer actions.
- Connected Quotation PO, DC, Colour, and Size item columns to the global Billing Layout switches.
- Added regression coverage for tenant access preservation and updated Billing Settings validation for the finalized payload.
- Bumped workspace version to 1.0.9.

## v-1.0.8

### [v 1.0.8] 2026-07-09 5:17 pm - update sales quotations

#### Database Changes

- Database update: Yes (auto-check).

#### App Codebase Changes

- Bumped workspace version to 1.0.8.

## v-1.0.7

### [v 1.0.7] 2026-07-08 7:28 pm - Database Lifecycle CLI

#### Database Changes

- Database update: Yes (manual).
- Added Platform database lifecycle commands for master and tenant databases: `db:migrate`, `db:seed`, `db:drop`, and `dbmigrate:fresh`.
- Added a Platform API database CLI that reuses the same Kysely migration and seed paths as application startup.
- Added tenant app-module migration and seed passes so registered tenant databases are migrated and seeded from the master tenant registry.
- Added `CODEXSUN_DB_FRESH_ON_START` to optionally drop, recreate, migrate, and seed configured databases during API startup.
- Added destructive action guards: `CODEXSUN_DB_RESET_CONFIRM=DROP_DATABASES`, plus `CODEXSUN_ALLOW_PRODUCTION_DB_RESET=1` when `NODE_ENV=production`.
- Made drop/fresh remove registered tenant databases before dropping the master database.

#### App Codebase Changes

- Simplified the tenant Countries list and editor to show only country name, country code, status, and active control;
  ISO, dial, currency, and sort-order fields remain backend-compatible but are hidden from the tenant frontend.
- Added tenant Country row actions for view, edit, suspend, and guarded force delete, with global country protection.
- Restyled the location Active control as a compact input-height status switch without helper text.
- Fixed bodyless location action requests so Suspend and Force delete are not rejected as empty JSON payloads.
- Replaced generic location duplicate failures with exact name/code conflict messages in the form error banner.
- Simplified the tenant State editor to State name, GST State code, Country, and Active in the same full-width tone as Country.
- Added State view, edit, suspend, and guarded force-delete row actions.
- Added reusable location dependency checks that block force deletion while child location records still reference a parent.
- Applied the finalized full-width master form and row-action pattern to Districts, Cities, and Pincodes.
- Replaced Pincode parent-name inputs with cascading Country, State, District, and City references.
- Enabled editing, suspension, and guarded deletion of seeded District, City, and Pincode rows inside each isolated tenant database.
- Made primary District, City, and Pincode values open Edit directly, removed redundant View actions, and protected the `-` placeholder rows.
- Backfilled seeded Pincodes with Country, State, District, and City IDs so legacy records populate relationship controls and participate in dependency checks.
- Added Tenant-pattern pagination to every location master list with rows-per-page controls, filtered totals, stable row numbering, and page reset on filter changes.
- Applied the finalized master-list pattern to Contact Groups, Contact Types, Address Types, and Bank Names.
- Added protected `-` seeds, editable seeded rows, pagination, clickable names, lifecycle menus, compact Active controls, and force delete for those four masters.
- Seeded Contact Groups with Business and Web Clients, and Contact Types with Customer, Supplier, Vendor Customer, Staff, and Employee.
- Expanded Bank Names from the current RBI directory across public, private, local-area, small-finance, payments, regional-rural, foreign, and state cooperative banks.
- Replaced protected-row text with a shared amber shield indicator and hover tooltip across location and contact masters.
- Extended the finalized protected-row, editable seed, pagination, lifecycle menu, compact Active, and no-sort-order pattern to all Product, Work Order, and Other common masters.
- Added persisted Currency symbols with INR and USD seed backfill, plus reusable missing-column migration support for common masters.
- Converted Months into FY 2026-27 accounting periods with Name, From date, To date, and Active.
- Added loud CLI/startup warnings before destructive database lifecycle actions.
- Added stable migration preflight/list/run/local-test, dump, restore-test, and backup-verification command names.
- Added explicit safety guards for restored-dump migration tests, sandbox restore tests, production backup verification, and backup artifact verification.
- Added database migration, backup, and legacy client migration runbooks plus reusable legacy intake/mapping/validation/cutover templates.
- Documented the baseline backup and restore-test schedule.
- Added console progress logs for database bootstrap, master/tenant database creation, migrations, platform app seeding,
  default tenant seeding, tenant module seeding, tenant admin seed status, and database CLI commands.
- Standardized Platform dev logs so `platform-api` displays as `api` and `platform-web` displays as `web` in stack and
  preflight output.
- Closed tenant database pools after provisioning so one-shot DB commands exit cleanly.
- Documented lifecycle switches in `.env` and `.env.example`.
- Bumped workspace version to 1.0.7.

## v-1.0.6

### [v 1.0.6] 2026-07-08 7:20 pm - Env Driven Tenant Domain Seed

#### Database Changes

- Database update: Yes (manual).
- Added `DEFAULT_TENANT_DOMAIN` so the test-only default tenant seed stores its primary domain from env.
- Added `TENANT_DOMAIN_BASE` so newly created tenant domains are generated from env instead of a hard-coded `.codexsun.local` suffix.
- Set the local/test default domain values to `localhost` in `.env` and `.env.example` while keeping seed data disabled and blank by default.
- Updated the CODEXSUN auth e2e to verify login through the seeded `localhost` tenant domain.

#### App Codebase Changes

- Removed the remaining hard-coded default tenant domain suffix from Platform API tenant seed/repository paths.
- Added `assist/documentation/project-inventory.md` as the current workspace inventory and latest work update for future agents.
- Linked the project inventory from `assist/README.md` and added it to the recommended reading order.
- Bumped workspace version to 1.0.6.

## v-1.0.5

### [v 1.0.5] 2026-07-08 7:04 pm - Test-Only Default Tenant Seed

#### Database Changes

- Database update: Yes (manual).
- Moved the default tenant seed behind `ENABLE_DEFAULT_TENANT_SEED=1`.
- Cleared fixed master database, tenant database, DB user, DB password, JWT, and seed user values from `.env` and `.env.example`.
- Made `DEFAULT_TENANT_*` optional for normal runtime and required only when the test seed switch is enabled.
- Kept CODEXSUN seed data inside e2e setup only, with disposable test databases.

#### App Codebase Changes

- Updated the environment helper banner to explain that default tenant values are test-only.
- Updated tenant database e2e setup to explicitly enable and configure the default seed for test runs.
- Bumped workspace version to 1.0.5.

## v-1.0.4

### [v 1.0.4] 2026-07-08 6:59 pm - Strict Environment Configuration

#### Database Changes

- Database update: Yes (manual).
- Removed runtime fallback database names from Platform, Core, Billing, and database helper code.
- Required `DB_MASTER_NAME`, `DB_USER`, `DB_PASSWORD`, and `DEFAULT_TENANT_*` values to come from explicit environment configuration.
- Changed the database user helper to read root `.env` and require configured admin/app user credentials and tenant database values.
- Kept e2e database tests isolated by injecting their own disposable environment values.

#### App Codebase Changes

- Added a shared missing/invalid `.env` banner with setup commands: `Copy-Item .env.example .env` and `npm run env:jwt-secret`.
- Removed runtime JWT development-secret fallbacks from Core and Billing APIs.
- Removed hard-coded admin email placeholders from shared UI layouts.
- Bumped workspace version to 1.0.4.

## v-1.0.3

### [v 1.0.3] 2026-07-08 6:52 pm - CODEXSUN Database Naming Seed

#### Database Changes

- Database update: Yes (manual).
- Changed the default master database name from `codexsun_master_db` to `cxsun_master_db`.
- Changed the default `CODEXSUN` tenant database name from `codexsun_tenant_db` to `codexsun_db`.
- Updated Platform, Core, Billing, setup tooling, and assist architecture references to use the new master database default.
- Kept the default tenant seeder idempotent so first boot creates or updates the `CODEXSUN` tenant with the new tenant database name.

#### App Codebase Changes

- Updated the `CODEXSUN` tenant auth e2e to run against disposable databases using the new naming pattern and verify seed, login, JWT/session, and tenant runtime.
- Bumped workspace version to 1.0.3.

## v-1.0.2

### [v 1.0.2] 2026-07-08 6:35 pm - Default CODEXSUN Tenant Auth Seed

#### Database Changes

- Database update: Yes (manual).
- Added an idempotent default tenant seed for `CODEXSUN` during Platform API bootstrap.
- Added `.env`-driven default tenant settings: name, corporate ID, slug, tenant database name, and default tenant admin credentials.
- Provisioned the default `CODEXSUN` tenant database with tenant module settings and a tenant-local admin user when `DEFAULT_TENANT_ADMIN_PASSWORD` is configured.
- Kept tenant identity database-owned by seeding master tenant and tenant domain rows, with `uuid` used for external JWT/session identity.

#### App Codebase Changes

- Hardened tenant login around the seeded tenant path: Corporate ID + domain resolution, tenant database lookup, tenant-local user verification, signed JWT issue, session verification, and tenant runtime access.
- Added `CODEXSUN` start-to-finish e2e coverage that boots the app, seeds the tenant, logs in, verifies the signed JWT/session, resolves runtime, and cleans up disposable databases.
- Updated platform e2e script to include both tenant database isolation and default tenant auth flows.
- Bumped workspace version to 1.0.2.

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
