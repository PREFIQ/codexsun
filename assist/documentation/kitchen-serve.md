# KitchenServe

KitchenServe is the tenant-scoped hotel and restaurant POS workflow for waiter order capture, kitchen execution, ready-to-serve handoff, and bill waiting.

## Runtime

- API: `7110`
- Web: `7120`
- Start: `node tools/dev-stack.mjs kitchen-serve`

The stack starts Platform API and Core API as supporting services, plus the isolated KitchenServe API and web runtime. KitchenServe does not depend on Billing.

## Operational Flow

`draft → submitted → accepted → preparing → ready → served → bill-waiting → closed`

Submitting an order creates station-specific kitchen tickets. Invalid lifecycle jumps are rejected. Every API operation requires `x-tenant-id`; the tenant database is selected through the validated `x-tenant-db` context.

## Module Direction

- Floor and tables
- Menu and modifiers
- Waiter orders
- Kitchen tickets and display
- Ready-to-serve notifications
- Bill-waiting queue
- Order history
- Outlets, shifts, counters, reservations, takeaway, delivery, reports, and settings

Core owns shared contacts, companies, products, and other reusable masters. KitchenServe owns restaurant-specific tables, menu presentation, orders, tickets, serving state, and bill-waiting state.
