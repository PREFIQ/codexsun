# Task 13 - Foundation Closure Audit And Business Readiness Gate

## Purpose

This is the final foundation task before CODEXSUN starts real business-module implementation.

Tasks 1 through 12 cover the main platform, framework, design-system, shell, admin, security, settings, document, communication, and agent foundations. Task 13 must verify those foundations are complete, consistent, documented, tested, and ready to support business modules such as contacts, items, billing, accounting, inventory, POS, compliance, offline sync, and industry packs.

Do not implement business logic in this task.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_13` |
| Status | `planned` |
| Depends on | Tasks 1 through 12 complete and verified |
| Focus | Foundation audit, gap closure, documentation, checklists, and go/no-go decision |
| Last updated | `2026-06-29` |

## Goal

Produce one clear foundation readiness result:

- What is complete.
- What is incomplete.
- What is intentionally deferred.
- What must be fixed before business modules.
- What can safely wait until a business module needs it.

The output should be a checked foundation ledger that future agents can trust.

## Required Reading

Read all execution tasks:

- `assist/execution/task.md`
- `assist/execution/task_1.md`
- `assist/execution/task_2.md`
- `assist/execution/task_3.md`
- `assist/execution/task_4.md`
- `assist/execution/task_5.md`
- `assist/execution/task_6.md`
- `assist/execution/task_7.md`
- `assist/execution/task_8.md`
- `assist/execution/task_9.md`
- `assist/execution/task_10.md`
- `assist/execution/task_11.md`
- `assist/execution/task_12.md`

Read core docs:

- `assist/README.md`
- `assist/blueprint/foundation-blueprint.md`
- `assist/blueprint/framework-foundation.md`
- `assist/blueprint/platform-foundation.md`
- `assist/architecture/architecture-principles.md`
- `assist/architecture/module-boundaries.md`
- `assist/architecture/tenant-isolation.md`
- `assist/architecture/security-and-compliance.md`
- `assist/governance/api-guidelines.md`
- `assist/governance/testing-strategy.md`
- `assist/governance/quality-gates.md`
- `assist/documentation/CHANGELOG.md`

## Foundation Coverage Analysis

Tasks 1 through 12 are under control if implemented as written:

- Task 1 and Task 3 settle trace and tenant context correctly: `correlationId` is technical tracing; `tenantId` is tenant business context.
- Task 2 and Task 4 establish platform backend safety: guards, repositories, audit, permissions, activation, modules, migrations, events, and queues.
- Task 5 and Task 6 establish frontend reuse: design-system dependency binding, workspace list/show/upsert patterns, app shell runtime, route metadata, and navigation.
- Task 7 through Task 9 establish admin and configuration surfaces: platform console, users, roles, permissions, sessions, settings, and feature flags.
- Task 10 and Task 11 establish cross-cutting operational foundations: files, documents, print, notifications, mail, comments, tags, assignments, and activity.
- Task 12 establishes safe agent groundwork without exposing business data too early.

The likely remaining risk is not missing a new large foundation area. The likely risk is inconsistency between tasks, docs, code, and tests. Task 13 exists to close that.

## Work Scope

### 1. Execution Task Consistency Audit

Check every task file for conflicts:

- `correlationId` vs `requestId` wording.
- `tenantId` vs `tenantCode` wording.
- hard delete vs archive/deactivate wording.
- cookie/JWT/hybrid auth mode wording.
- framework vs platform ownership.
- UI package dependency ownership.
- business-logic out-of-scope boundaries.

Required result:

- Update stale task wording.
- Mark superseded instructions clearly.
- Do not silently leave conflicting instructions for future agents.

### 2. Architecture Boundary Audit

Verify boundaries:

- Framework stays technical and business-rule free.
- Platform owns tenant, auth, permissions, activation, audit, settings, notifications, module catalog.
- UI owns reusable visual components and third-party UI bindings.
- Platform Web owns routes, runtime data assembly, and demo pages.
- Business modules remain unimplemented.

Required result:

- Any boundary violation is fixed or recorded as a blocker.

### 3. API Contract Audit

Verify:

- `x-correlation-id` exists as public trace header.
- Envelope meta includes `correlationId`.
- `x-tenant-id` remains tenant context only.
- Protected tenant routes validate authenticated tenant context.
- Errors use standard envelopes.
- Auth/session/logout behavior matches docs.
- API docs match implementation.

Required result:

- API contract is documented and tested.

### 4. Security And Tenant Isolation Audit

Verify:

- tenant header alone never authorizes.
- sessions/JWTs carry correct tenant context.
- tenant management requires super-admin permission.
- staff/tenant users cannot access platform admin functions.
- secrets are masked.
- audit logs avoid passwords/tokens/secrets.
- support views do not leak tenant business data.

Required result:

- No known tenant leak or privilege escalation path remains in foundation code.

### 5. Migration And Data Lifecycle Audit

Verify:

- master migrations are versioned.
- tenant migrations are versioned or clearly staged.
- migration status is visible.
- startup/bootstrap failure policy is documented.
- tenant delete policy is archive/deactivate unless explicitly dev-only.
- file/document metadata lifecycle is defined.

Required result:

- Database changes are repeatable, inspectable, and documented.

### 6. UI Foundation Audit

Verify:

- `@codexsun/ui` owns reusable workspace components.
- third-party UI dependencies are bound through `@codexsun/ui`.
- `WorkspaceList` is the single list/show engine.
- `CommonList`, `MasterList`, and `EntryList` are presets, not forks.
- upsert surfaces are separated by workflow.
- template pages exist and match screenshots.
- app shell navigation is runtime-driven.
- responsive layout is verified.

Required result:

- Frontend foundation can support future apps without copying list/table/form code.

### 7. Admin And Operations Audit

Verify:

- platform admin console exists.
- tenant registry is usable.
- module activation is visible.
- audit viewer exists.
- migration viewer exists.
- health/support views exist.
- settings/config screens exist.
- notification/activity/document foundations are visible enough for support.

Required result:

- Super Admin can inspect foundation state without database access.

### 8. Agent Safety Audit

Verify:

- CODEIT/ZERO boundaries are documented.
- agent tool registry exists if Task 12 implemented it.
- agent actions are audited.
- tenant-safe context rules exist.
- no unrestricted business database access exists.
- irreversible/external actions require confirmation.

Required result:

- AI foundation is safe but not yet connected to business data.

### 9. Test And Verification Audit

Run:

```bash
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -w @codexsun/framework
npm.cmd run test -w @codexsun/platform-api
```

Also run any added package tests:

```bash
npm.cmd run test -w @codexsun/platform
npm.cmd run test -w @codexsun/ui
npm.cmd run test -w @codexsun/platform-web
```

If a package has no test script, record that clearly.

Required result:

- All available checks pass, or blockers are documented.

### 10. Documentation And Changelog Audit

Verify:

- architecture docs match current code.
- API docs match current contract.
- platform foundation docs describe current modules.
- design-system docs describe workspace/list/upsert usage.
- operations docs describe migrations, health, audit, and support.
- changelog separates database changes and app code changes.

Required result:

- New agents can start business-module planning without reverse-engineering the foundation.

## Foundation Completion Checklist

Use this checklist to mark final readiness.

### Execution Tasks

- [ ] Task 1 reviewed and stale instructions marked superseded where needed.
- [ ] Task 2 reviewed and stale instructions marked superseded where needed.
- [ ] Task 3 implemented: correlation and tenant context restored/separated.
- [ ] Task 4 implemented: framework/platform module readiness.
- [ ] Task 5 implemented: workspace design system and reusable list/upsert patterns.
- [ ] Task 6 implemented: workspace navigation and app shell runtime.
- [ ] Task 7 implemented: platform admin console.
- [ ] Task 8 implemented: user, role, and permission UI.
- [ ] Task 9 implemented: settings and configuration foundation.
- [ ] Task 10 implemented: document, file, and print template foundation.
- [ ] Task 11 implemented: notification, mail, and activity foundation.
- [ ] Task 12 implemented: developer and agent workbench foundation.

### Framework

- [ ] API app bootstrap is stable.
- [ ] `x-correlation-id` is supported and echoed.
- [ ] Envelope meta includes `correlationId`.
- [ ] Tenant context is separate from correlation context.
- [ ] Request logging includes correlation and tenant context where relevant.
- [ ] Health route status policy is documented and tested.
- [ ] Database pool and shutdown behavior are implemented.
- [ ] Module registration contract exists.
- [ ] Event contracts include `correlationId` and optional `tenantId`.
- [ ] Queue contracts include `correlationId` and optional `tenantId`.
- [ ] Framework has no platform business rules.

### Platform Backend

- [ ] Auth mode behavior is clear and tested.
- [ ] JWT/session payload carries tenant id/code correctly.
- [ ] Tenant login resolves tenant database safely.
- [ ] Tenant management uses repository/service boundaries.
- [ ] Tenant routes validate input.
- [ ] Tenant delete policy is archive/deactivate or explicitly dev-only.
- [ ] Permission model exists.
- [ ] Activation model exists.
- [ ] Module catalog exists.
- [ ] Versioned migration runner exists.
- [ ] Audit events include `correlationId`.
- [ ] Secrets are masked.
- [ ] Support endpoints are protected.

### Platform Web And UI

- [ ] `@codexsun/ui` binds shared UI libraries.
- [ ] Workspace components are exported from `@codexsun/ui`.
- [ ] `WorkspaceList` is the single list/show engine.
- [ ] Common/Master/Entry list presets reuse the same list engine.
- [ ] Upsert page/dialog components are separate.
- [ ] Entry line table exists.
- [ ] Print preview component exists.
- [ ] App shell runtime exists.
- [ ] Route metadata drives title, breadcrumb, and active nav.
- [ ] Shell state components exist.
- [ ] Mobile/responsive behavior is checked.
- [ ] Screenshot reference screens are matched.

### Admin And Operations

- [ ] Super Admin console exists.
- [ ] Tenant registry screens exist.
- [ ] Module activation screens exist.
- [ ] Audit viewer exists.
- [ ] Migration status viewer exists.
- [ ] Health/support view exists.
- [ ] User management screens exist.
- [ ] Role management screens exist.
- [ ] Permission matrix exists.
- [ ] Session management exists.
- [ ] Settings/config screens exist.
- [ ] Feature flag screens exist.

### Cross-Cutting Foundations

- [ ] File metadata contract exists.
- [ ] Attachment UI exists.
- [ ] Document preview shell exists.
- [ ] Print template registry exists.
- [ ] Notification center shell exists.
- [ ] Activity timeline exists.
- [ ] Comment composer exists.
- [ ] Assign/tag/watch pattern exists.
- [ ] Mail template shell exists.
- [ ] Agent/tool registry exists.
- [ ] Agent action audit exists.
- [ ] Agent provider settings shell exists.

### Security And Governance

- [ ] Tenant header alone never authorizes.
- [ ] Tenant-scoped routes enforce tenant match.
- [ ] Permissions and activation are separate.
- [ ] Staff/tenant users cannot access platform admin features.
- [ ] Audit logs avoid sensitive secrets.
- [ ] AI tools have permission boundaries.
- [ ] Quality gates are documented.
- [ ] Testing strategy is followed.

### Verification

- [ ] `npm.cmd run typecheck` passes.
- [ ] `npm.cmd run lint` passes.
- [ ] Framework tests pass.
- [ ] Platform API tests pass.
- [ ] Platform package tests pass or absence is documented.
- [ ] UI tests pass or absence is documented.
- [ ] Platform Web checks pass.
- [ ] Manual responsive UI QA completed.
- [ ] Changelog updated.

## Readiness Decision

At the end of Task 13, write one of these decisions at the top of the final handoff:

```text
Foundation decision: READY FOR BUSINESS MODULES
```

or

```text
Foundation decision: NOT READY
Blocking gaps:
- ...
```

## Out Of Scope

- Implementing contacts, items, billing, accounting, inventory, POS, compliance, offline sync, or industry packs.
- Adding customer-specific business rules.
- Adding production integrations.
- Adding AI business data tools.

## Final Handoff Output

The final handoff should include:

- foundation decision
- completed checklist summary
- remaining blockers
- deferred non-blocking items
- tests/checks run
- first recommended business-module task if ready

Recommended first business-module task after readiness:

```text
Task 14 - Common Master Data Foundation
```

Only create Task 14 after Task 13 says the foundation is ready.
