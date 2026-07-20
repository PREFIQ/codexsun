# CODEXSUN Project Inventory

> Database boundary update: the Platform master database contains only global Platform/Super Admin tables. Core, Billing, KitchenServe, and tenant identity/access tables are tenant-database owned. Project Manager, Task Manager, and Data Bridge remain JSON-backed.

## Purpose

This document records what is present in the current CODEXSUN workspace. Use it as the first practical inventory before
planning new work, because some assist files describe future direction or older foundation snapshots.

Last reviewed: 2026-07-08.

## Current Workspace Shape

```text
apps/
  platform/
    api/
    web/
  sites/
    web/
  core/
    api/
    web/
  billing/
    api/
    web/
  b2bconnect/
    api/
    web/
  ecommerce/
    api/
    web/

packages/
  framework/
  ui/

tools/
  version/
  *.mjs

assist/
  agents/
  architecture/
  blueprint/
  devops/
  documentation/
  execution/
  governance/
  handoff/
  industries/
  operations/
  product/
```

The root package uses npm workspaces with `apps/*/*`, `packages/*`, and `tools/*`.

## Runtime Apps

### Platform

Platform owns the SaaS foundation.

- `apps/platform/api`: Fastify API for tenant identity, auth, app registry, database setup, tenant provisioning, and
  platform operations.
- `apps/platform/web`: React/Vite shell for the domain-resolved tenant app portal, login, super-admin desk, admin
  desk, tenant desk, tenant UI, and design-system gallery. Platform does not import or compose Sites pages.

Current Platform API modules:

- `app-registry`
- `tenant`

Current Platform Web modules:

- `design-system`
- `tenant`
- `tenant-portal` (read-only public projection owned by `platform.tenant`)

### Sites

Sites owns public marketing websites and their client-specific builds.

- `apps/sites/web/clients/codexsun`: CODEXSUN creator site for marketing the software platform and development work.
- `apps/sites/web/clients/logicx`: Logicx Info Tech public site for custom software, ERPNext, Tally integration,
  websites, automation, and hosting services.
- `apps/sites/web/clients/techmedia`: Tech Media public site for computers, gaming gear, accessories, setup, repairs,
  and custom builds.
- `apps/sites/web/shared`: visual-only client-site canvas and document metadata helpers; client content, routes, and
  business identity remain inside each client owner.
- `apps/sites/web/runtime`: the standalone Vite entry that binds exactly one concrete client at build time.

The Sites build emits independent artifacts under `dist/apps/sites/web/{client}`. CODEXSUN, Logicx, and Tech Media
remain independently hosted marketing clients. Sites can link to Platform through configured origins, but Platform
does not import any Sites package or marketing route.

### Core

Core owns shared business foundation modules that future apps can reuse.

- `apps/core/api`: Fastify API package for core/common domain modules.
- `apps/core/web`: React/Vite frontend for core/common module screens.

Current Core common modules include location masters, contacts, products, work orders, organisation setup, and the
accounts masters `ledger-groups` and `ledgers`. Each accounts master owns its API migration, repository, service,
routes, seed, and frontend workspace; ledgers reference ledger groups within the tenant database.

### Billing

Billing owns billing-related business modules.

- `apps/billing/api`: Fastify API package for billing domain modules.
- `apps/billing/web`: React/Vite frontend for billing workflows.

Current Billing module:

- `sales`

### Mail

Mail owns tenant-scoped outbound delivery, inbound synchronization, message history, attachments, and provider configuration.

- `apps/mail/api`: Fastify module package with tenant migrations, encrypted settings, SMTP delivery, IMAP/POP3 synchronization, queue workers, retries, events, and public contracts.
- `apps/mail/web`: React workspace for Inbox, Outbox, Drafts, Scheduled, Sent, Failed, Trash, rich compose, attachments, and tenant settings.

Billing document screens consume Mail only through its public web contract to capture the visible invoice or quotation as a PDF and enqueue a branded customer email.

### B2B Connect (`b2bconnect`)

B2B Connect is a standalone, deployment-configurable marketplace portal for connecting verified
business buyers and sellers. Tirupur Connect is one possible branded deployment.

- `apps/b2bconnect/api`: runnable Fastify API with typed app-information, authentication, client
  portal, administration, super-administration, business-profile, and network-blueprint contracts.
  Business profiles use an app-owned SQLite store under `storage/b2bconnect/`; submissions and
  resubmissions are audited, administrator reviews are recorded, and only approved projections are
  public.
- `apps/b2bconnect/web`: runnable React/Vite app with a module-owned public landing page at `/`
  and independently owned protected desks at `/app`, `/admin`, and `/sa`. Client login is `/login`;
  administrator login is `/admin/login`; super-administrator login is `/sa/login`.
- Brand name, tagline, and purpose are owned by `api/src/config/app-profile.ts`; the web shell reads
  that profile through the typed app-information endpoint and keeps a generic code fallback.
- Platform is the only credential and JWT authority. The B2B-owned authentication adapter maps
  Platform `tenant`, `staff`, and `super_admin` identities to the client, admin, and super-admin
  desks. Client login silently submits the code-owned `B2BCONNECT` deployment tenant code, stores
  Platform's resolved tenant database context, and sends it on every protected B2B request. B2B has
  no credential configuration, login endpoint, auth persistence, or user-management CRUD.
- The client desk owns business-profile submission and resubmission. The administration desk owns
  the approval queue and support review. Super administration sees platform positioning, rollout
  capabilities, role responsibilities, association hubs, WhatsApp strategy, and profile-status
  oversight.
- The public landing page reads the operating-system blueprint dynamically and publishes only
  approved business profiles, including an optional direct WhatsApp inquiry action.
- Planned leaf boundaries are Leads, RFQ, Capacity Exchange, Networking, Jobs, Events, Finance,
  Export Intelligence, association membership, and WhatsApp delivery. They must not be implemented
  as a centralized marketplace CRUD module.

### Ecommerce (`ecommerce`)

Ecommerce is a standalone, deployment-configurable public multi-vendor marketplace. Lifeshoppy,
Tech Media, and Tirupur Direct are example profiles.

- `apps/ecommerce/api`: runnable Fastify API scaffold with a typed app-information contract.
- `apps/ecommerce/web`: runnable React/Vite app with a module-owned public storefront landing page
  at `/` and the independently owned commerce desk at `/app` (with `/dashboard` retained as an alias).
- Brand name, tagline, and purpose are owned by `api/src/config/app-profile.ts`; the web shell reads
  that profile through the typed app-information endpoint and keeps a generic code fallback.
- Current ownership is intentionally scaffold-only: no business tables or CRUD entities exist yet.
- Planned leaf boundaries are vendors, catalog, cart, orders, and fulfilment.

Both scaffolds use explicit shell-only exemptions in the module-boundary checker. Adding any planned
business leaf requires its full backend/frontend role contract; neither app may introduce shared or
metadata-driven business CRUD.

Runtime bundle composition is enforced by `tools/product-stack-contract.mjs`: B2B Connect starts
with Platform and Core, while Ecommerce starts with Platform, Core, and Billing. These dependencies
provide foundation services only; each marketplace continues to own its business modules, tables,
routes, validation, lifecycle, events, and frontend workspaces just as Billing owns its own leaves.

Product development and release tooling preserves those boundaries. A product dev command attaches
to an already healthy dependency API and stops only processes it started. `npm run stack:impact --
<changed files>` identifies the verification blast radius, while `npm run stack:plan -- <stack>`
prints the independently deployable services, owned migration scopes, and health-gated rollback plan.

Their `.env` contract contains network configuration only: API/web hosts or origins and ports. Product
names, purpose text, taglines, and other business identity must not be added to `.env`.

For deployment, the repository is shared but runtime state is not. Every named B2B installation uses
its own service containers and its own Platform master, tenant/Core, and B2B marketplace database
volumes. Core features are consumed through public Core APIs using the same Platform tenant identity;
B2B never imports Core private code or writes Core tables.

## Shared Packages

### `@codexsun/framework`

Shared backend runtime package. It exports API bootstrap helpers, config/env loading, database contracts, errors,
events, health, HTTP envelope utilities, logging, module contracts, queues, storage contracts, and testing helpers.

### `@codexsun/ui`

Shared frontend UI package. It exports components, layouts, menu blocks, design-system tokens, workspace controls,
workspace presets, forms, tables, filters, panels, date picker, autocomplete, drag/drop helpers, print helpers, and
shared styling.

## Tooling

Important root commands:

```text
npm run dev:api
npm run dev:web
npm run dev:sites
npm run dev:domains
npm run build
npm run typecheck
npm run lint
npm run check
npm run verify:platform
npm run verify:billing
npm run verify:core
npm run verify:sites
npm run verify:b2bconnect
npm run verify:ecommerce
npm run check:module-boundaries
npm run db:migrate
npm run db:seed
npm run db:drop
npm run dbmigrate:fresh
npm run test:e2e:tenant
npm run version:show
npm run version:bump
npm run changelog:append
npm run check:versions
```

Database commands currently route through `@codexsun/platform-api` and `apps/platform/api/src/database/db-cli.ts`.

## Current Version And Work Update

Current recorded version: `1.0.6`.

Latest changelog entry: `v-1.0.6` on 2026-07-08 at 7:20 pm.

Latest recorded work:

- Environment-driven tenant domain seed.
- `DEFAULT_TENANT_DOMAIN` controls the test-only default tenant primary domain.
- `TENANT_DOMAIN_BASE` controls generated tenant domains instead of hard-coded `.codexsun.local`.
- Local/test default domain values are set to `localhost` in `.env` and `.env.example`.
- Tenant seed data remains disabled and blank by default.
- The default tenant auth e2e verifies login through the seeded `localhost` tenant domain.
- Workspace version is `1.0.6`.

Current working tree note:

- There are uncommitted code/config changes outside `assist/` at the time of this review.
- Treat those changes as active work and inspect them before editing related database, environment, or Platform API files.

## Documentation Notes

Use these files first for active work:

- `assist/README.md`: high-level product and agent entry point.
- `assist/documentation/CHANGELOG.md`: latest recorded version state and change history.
- `assist/documentation/project-inventory.md`: current repo inventory.
- `assist/documentation/app-bundle-structure.md`: target app/module ownership rules.
- `assist/documentation/design-system-helper.md`: UI and module screen standards.
- `assist/governance/rules.md`: general development rules.
- `assist/governance/engineering-standards.md`: engineering practices.
- `assist/governance/testing-strategy.md`: verification expectations.
- `assist/governance/quality-gates.md`: finish-line checks.

Some execution and handoff files preserve earlier foundation history or future direction. Validate their code paths
against this inventory before treating them as current implementation state.
