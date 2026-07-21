# CODEXSUN Project Inventory

> Database boundary update: the Platform master database contains only global Platform/Super Admin tables. Core, Billing, and tenant identity/access tables are tenant-database owned. Project Manager and Task Manager remain JSON-backed.

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
  core/
    api/
    web/
  billing/
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
  desk, tenant desk, tenant UI, and design-system gallery.

Current Platform API modules:

- `app-registry`
- `tenant`

Current Platform Web modules:

- `design-system`
- `tenant`
- `tenant-portal` (read-only public projection owned by `platform.tenant`)

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

Product development and release tooling preserves those boundaries. A product dev command attaches
to an already healthy dependency API and stops only processes it started. `npm run stack:impact --
<changed files>` identifies the verification blast radius, while `npm run stack:plan -- <stack>`
prints the independently deployable services, owned migration scopes, and health-gated rollback plan.

The `.env` contract contains network configuration only: API/web hosts or origins and ports. Product
names, purpose text, taglines, and other business identity must not be added to `.env`.

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
npm run dev:domains
npm run build
npm run typecheck
npm run lint
npm run check
npm run verify:platform
npm run verify:billing
npm run verify:core
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
