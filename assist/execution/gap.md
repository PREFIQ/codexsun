# Gaps & Blockers: Framework, Platform & Core

## CRITICAL BLOCKERS

| #   | Layer        | Issue                                                                                                                                                                                                                      |
| --- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Platform API | No auth middleware on 11 of 13 modules — routes like `/admin/tenants`, `/admin/plans`, `/admin/subscriptions`, `/admin/apps`, `/admin/industries` etc. have zero authentication. Anyone with network access can call them. |
| 2   | Core API     | Zero auth on all endpoints — every core route is fully public. No JWT verification, no API keys, no sessions.                                                                                                              |
| 3   | Core API     | No global error handler — unhandled exceptions leak stack traces. No `setErrorHandler` registered.                                                                                                                         |
| 4   | Platform API | No request validation — all routes cast `request.body as AnyType` with zero Zod/Joi schema validation at the boundary.                                                                                                     |
| 5   | Core API     | Same: no request/param/query validation — only ad-hoc string checks in services.                                                                                                                                           |

## HIGH-SEVERITY GAPS

| #   | Layer        | Gap                                                                                                                                                           |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | Framework    | `storage/` is pure interfaces only — no filesystem, S3, or MinIO adapter exists. Platform storage manager stores metadata but cannot read/write actual files. |
| 7   | Framework    | `queue/` has no real adapter — only an in-memory stub that pushes to an array. No BullMQ, no RabbitMQ, no dequeue/worker abstraction.                         |
| 8   | Framework    | `events/` has no real event bus — only an in-memory stub. No outbox pattern, no subscriber/consumer.                                                          |
| 9   | Framework    | `config/` type exists but zero loading logic — `AppConfig` is defined but never instantiated anywhere. No YAML/JSON config parser.                            |
| 10  | Framework    | DB layer missing: transactions, health checks (ping), pool configuration, reconnect/retry — `connectionLimit: 10` is hardcoded.                               |
| 11  | Platform API | No 404 handler / no schema error formatter — non-envelope responses leak through on unknown routes and validation errors.                                     |
| 12  | Platform API | Custom JWT (HMAC-SHA256, no standard library) — more surface for vulnerabilities. Tokens stored in localStorage (XSS-vulnerable).                             |
| 13  | Platform API | `x-tenant-id` header not validated against JWT claims — any tenant user can spoof another tenant's ID.                                                        |
| 14  | Platform API | No rate limiting on `/auth/login` — brute force is possible.                                                                                                  |

## MEDIUM-SEVERITY GAPS

| #   | Layer        | Gap                                                                                                                                                                    |
| --- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 15  | Framework    | No authN/authZ module at all — auth is handled ad-hoc in platform-api only (not reusable).                                                                             |
| 16  | Framework    | No caching abstraction — no Redis/Memcached integration.                                                                                                               |
| 17  | Framework    | No metrics/telemetry — no OpenTelemetry, Prometheus, or similar.                                                                                                       |
| 18  | Framework    | No rate limiting or trust-proxy plugin in Fastify setup.                                                                                                               |
| 19  | Platform Web | Admin Desk stubs: "Tenant Support" and "Activation" are placeholder badges only.                                                                                       |
| 20  | Platform Web | App Desk minimals: "Application Profile", "Application Settings", "Billing Settings" are cards with badges.                                                            |
| 21  | Core Web     | All forms are read-only — the only UI (Location workspace) has `readOnly` on every input. No create/edit/delete.                                                       |
| 22  | Core Web     | No web pages for 19+ common master entities (contacts, products, workorder, entries) — backend routes exist but no frontend.                                           |
| 23  | Billing      | Only Sales module exists — Quotations, Purchase, Receipt, Payments, Credit/Debit notes, GST, e-Invoice, POS are all missing despite being in the domain map.           |
| 24  | Accounts     | API exists (ledgers, vouchers) but no web frontend — not even in dev-stack or preflight. Undeployable.                                                                 |
| 25  | Platform API | DB CLI has stubs: `dump:create` and `dump:download` print "not implemented".                                                                                           |
| 26  | Core API     | Sync/Worker/Event files exist but are never wired — `*.sync.ts`, `*.worker.ts`, `*.events.ts` files exist across all sub-modules but are never registered or consumed. |

## LOW-SEVERITY / FUTURE-PLANNED GAPS

| #   | Gap                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------- |
| 27  | `packages/platform`, `packages/core`, `packages/api-client` — documented shared packages that don't exist |
| 28  | `apps/ecommerce`, `apps/crm`, `apps/sites` — documented apps not built                                    |
| 29  | `cxsync` (offline sync engine) — detailed doc exists, zero code                                           |
| 30  | `cxdeploy` (deployment tool) — detailed doc exists, zero code                                             |
| 31  | Dedicated per-tenant databases — only master DB implemented                                               |
| 32  | Domain/subdomain tenant resolution — only header-based                                                    |
| 33  | Docker configuration — none exists despite detailed deployment doc                                        |
| 34  | MFA, refresh tokens, passwordless auth, OAuth/SSO                                                         |
| 35  | Real SMTP/mail provider — in-memory only                                                                  |
| 36  | BullMQ/Redis queue backend — database queue is the only option                                            |
| 37  | S3/MinIO storage — pure interface only                                                                    |
| 38  | Playwright E2E tests — config exists, zero tests                                                          |
| 39  | Electron desktop / React Native mobile                                                                    |
| 40  | AI agents (CODEIT/ZERO) — registry exists, no real AI functionality                                       |

## SUMMARY

**What's production-ready:** The framework's `api/` module (Fastify server bootstrap), platform's tenant/subscription/app-registry modules, billing's sales module, the workspace UI system.

**What blocks shipping:** No auth on core API (100% public), no auth on most platform API routes, no input validation, no storage/queue/event infrastructure, no tenant database provisioning, no working frontend for core business modules.

The project is approximately **80% unimplemented** relative to its documented architecture — the existing code is well-structured, but the scope of documented features vastly exceeds what's built.
