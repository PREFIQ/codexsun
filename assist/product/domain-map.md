# Domain Map

## Domain Strategy

CODEXSUN should be divided into domains that match business meaning. Each domain owns its language, rules, data, events, and APIs.

Domains should communicate through explicit contracts, not direct table access.

## Core Domains

### Tenant Domain

Owns:

- Tenant profile.
- Tenant database mapping.
- Tenant settings.
- Tenant lifecycle.
- Tenant isolation rules.
- Tenant backup and restore policy.

### Identity Domain

Owns:

- Users.
- Sessions.
- Roles.
- Permissions.
- Authentication providers.
- Password and security policies.

### Subscription Domain

Owns:

- Plans.
- Add-ons.
- Feature activation.
- License status.
- Trial and expiry rules.
- Runtime module access.

### Billing Domain

Owns:

- Invoices.
- Estimates.
- Credit notes.
- Debit notes.
- POS bills.
- Industry bill formats.
- GST calculation.
- e-Invoice and e-Way bill workflow.

### Accounting Domain

Owns:

- Ledgers.
- Groups.
- Vouchers.
- Journals.
- Financial years.
- Reports.
- Compliance exports.

### Inventory Domain

Owns:

- Items.
- Stock movements.
- Warehouses.
- Batches.
- Units.
- Valuation.
- Stock reports.

### Workflow Domain

Owns:

- Tasks.
- Activities.
- Approvals.
- Reminders.
- Status flows.

### Communication Domain

Owns:

- Mail.
- SMS if added.
- WhatsApp.
- Telegram.
- Notification templates.
- Delivery status.

### Integration Domain

Owns:

- External API credentials.
- Integration adapters.
- Webhooks.
- Import and export jobs.
- Integration logs.

### B2B Connect Marketplace Domain

Owns:

- Verified business organisations.
- Buyer requirements.
- Seller offers.
- Buyer-to-seller enquiries and connection workflow.
- B2B verification, moderation, permission, and audit rules.

The stable application key is `b2bconnect`. Brand name, tagline, and purpose belong to the app-owned
profile in code or a future deployment-profile database record. Environment configuration contains
network hosts and ports only. This allows deployments such as Tirupur Connect without moving product
identity into `.env`. It must not share a generic marketplace CRUD engine with Ecommerce or any
other app.

Its deployment stack is `framework + platform + core + b2bconnect`. Platform owns identity, tenant,
permissions, activation, audit, queue, and operational controls. Core provides common tenant masters
through public contracts. B2B Connect retains exclusive ownership of marketplace profiles, leads,
RFQs, capacity, networking, jobs, events, finance discovery, export intelligence, association hubs,
verification, moderation, and public projections.

B2B Connect owns its authentication adapter and role-protected runtime surfaces. `/` is public,
`/app` is the client marketplace portal, `/admin` is marketplace operations, and `/sa` is deployment
control. Each protected desk has its own backend dashboard contract and frontend module; role checks
are enforced by the B2B API rather than only by client-side routing. The adapter never stores
credentials or signs application tokens: the separate B2B login screen calls Platform identity,
silently supplies the fixed deployment tenant code for `/app`, and forwards Platform's signed token
and resolved tenant context. B2B rejects a client token issued for any other deployment tenant.

The Tirupur deployment is positioned as a digital business network and textile-industry operating
system. Its product map combines Directory, Leads, RFQ, Capacity Exchange, Networking, Jobs, Events,
Finance, Export Intelligence, association hubs, and WhatsApp-first engagement. Each capability must
be implemented as its own B2B-owned leaf module; this product map is not permission to centralize
their CRUD. The current `business-profile` module persists client-owned profiles in the B2B database,
routes every edit back through administrator approval, audits submissions and reviews, and projects
only approved profiles to public pages. The `network-blueprint` module owns the current positioning
and rollout metadata. Leads, RFQ, capacity, networking, jobs, events, finance, export intelligence,
association membership, and outbound WhatsApp notifications remain separate planned modules.

### Ecommerce Marketplace Domain

Owns:

- Multi-vendor onboarding and ecommerce participation.
- Public product catalog and availability.
- Customer carts and checkout.
- Ecommerce orders.
- Fulfilment and public-customer delivery coordination.

The stable application key is `ecommerce`. Brand name, tagline, and purpose belong to the app-owned
profile in code or a future deployment-profile database record. Environment configuration contains
network hosts and ports only. This allows deployments such as Lifeshoppy, Tech Media, or Tirupur
Direct without moving product identity into `.env`. It may coordinate with Core and Billing through
public contracts or events, but it must own its ecommerce behavior and must not write directly to
another app's tables.

Its deployment stack is `framework + platform + core + billing + ecommerce`. Ecommerce may request
Core master data and ask Billing to create financial documents through stable contracts or events,
but vendors, catalog, carts, ecommerce orders, fulfilment, storefront behavior, and marketplace
settings remain Ecommerce-owned modules.

### AI Domain

Owns:

- Assistant profiles.
- Model routing.
- Prompt policies.
- Tool permissions.
- AI audit trail.
- Knowledge access.

## Supporting Domains

- Reporting.
- Document templates.
- File storage.
- Search.
- Sync.
- Queue management.
- Audit.
- Settings.

## Bounded Context Rules

- A module must own its own models and business rules.
- Shared utilities must not contain business decisions.
- Cross-domain communication should use application services, public contracts, or domain events.
- Database tables from another domain must not be directly modified.
- UI screens should respect domain ownership even when they combine data from multiple modules.
- Reports may read across domains through approved reporting models or read replicas.
