# Task 21 - Accounts Engine Foundation

## Purpose

Create the CODEXSUN Accounts app as a separate business app from Billing. Billing remains the operational document
entry system. Accounts becomes the financial truth system for ledgers, groups, vouchers, double-entry postings,
balances, reports, auditability, and future Tally integration.

The target is a Tally-compatible, Tally-like Indian double-entry accounting engine. Do not copy Tally software,
screens, source behavior, or protected product expression. Match the accounting expectations Indian businesses need:
ledger groups, voucher types, debit/credit postings, GST ledgers, financial year behavior, outstanding balances,
audit-safe reversals, and Tally-ready export contracts.

## Architecture Rule

- [x] Billing and Accounts stay as separate apps.
- [x] Billing owns invoices, quotations, receipts, payments, purchases, credit notes, debit notes, and document lifecycle.
- [x] Accounts owns account groups, ledgers, voucher types, vouchers, postings, balances, outstanding, reports, and Tally sync contracts.
- [x] Billing never writes ledger balances directly.
- [x] Billing create/update/cancel/delete emits or calls an accounting posting contract.
- [x] Accounts classifies the source document and creates balanced double-entry vouchers.
- [x] Accounts is the only source of financial truth.
- [x] Tally integration consumes Accounts vouchers, not Billing UI documents directly.

## Phase 1 - Accounts App Foundation

- [x] Create `apps/accounts/api` package in the same live repo convention as Core and Billing.
- [x] Create `apps/accounts/web` package in the same live repo convention as Core and Billing.
- [x] Add Accounts API bootstrap with health check.
- [x] Add Accounts database bootstrap using tenant/master database naming pattern already used by Billing/Core.
- [x] Add Accounts frontend exports for shell composition.
- [x] Keep all business behavior in Accounts module folders.

## Phase 2 - Account Groups And Ledgers

- [x] Add Account Groups module.
- [x] Seed primary Indian/Tally-style groups: Assets, Liabilities, Income, Expenses, Capital.
- [x] Seed practical ledger groups: Sundry Debtors, Sundry Creditors, Sales Accounts, Purchase Accounts, Duties & Taxes, Cash-in-Hand, Bank Accounts, Round Off, Discounts.
- [x] Add Ledgers module.
- [x] Support customer, supplier, sales, purchase, GST, cash, bank, round-off, discount, and adjustment ledger classifications.
- [x] Store opening balance, current debit, current credit, and calculated closing balance.
- [ ] Include tenant context fields and source trace fields where needed.
- [x] Add list/get/create/update/status endpoints.
- [x] Add lookup endpoints for voucher and posting screens.
- [x] Add backend validation for required fields, duplicate names/codes, group references, and status values.

## Phase 3 - Voucher And Posting Engine

- [x] Add Voucher Types module or typed voucher type contract.
- [x] Add Vouchers module.
- [x] Add Voucher Lines/Postings module behavior inside the voucher module.
- [x] Every voucher must balance: total debit equals total credit.
- [x] Support Sales, Purchase, Receipt, Payment, Contra, Journal, Credit Note, Debit Note.
- [x] Store source app, source module, source document id, source document number, source operation, and posting version.
- [x] Add idempotency by source reference.
- [x] Support create, update/repost, cancel/reversal, and delete-as-reversal behavior.
- [x] Do not physically erase financial history for posted business documents.
- [x] Recalculate ledger debit, credit, and closing balances after voucher posting.

## Phase 4 - Billing-To-Accounts Posting Contract

- [x] Add public posting request type for Billing.
- [x] Add create/update/cancel/delete posting operations.
- [x] Sales invoice posting:
  - [x] Debit customer ledger.
  - [x] Credit sales ledger.
  - [x] Credit output CGST/SGST/IGST ledgers as applicable.
  - [x] Debit or credit round-off ledger as applicable.
- [x] Purchase invoice posting:
  - [x] Debit purchase ledger.
  - [x] Debit input GST ledgers as applicable.
  - [x] Credit supplier ledger.
  - [x] Debit or credit round-off ledger as applicable.
- [x] Receipt posting:
  - [x] Debit cash/bank ledger.
  - [x] Credit customer ledger.
- [x] Payment posting:
  - [x] Debit supplier ledger or expense ledger.
  - [x] Credit cash/bank ledger.
- [x] Credit note/debit note posting rules.
- [x] Billing update should reverse/repost when period is open.
- [x] Billing cancel/delete should create reversal or cancelled voucher state.
- [x] Locked financial periods must reject destructive reposting and require adjustment vouchers.

## Phase 5 - Outstanding And Reports

- [x] Calculate party outstanding from ledger/voucher postings.
- [x] Sales invoice increases customer receivable.
- [x] Receipt decreases customer receivable.
- [x] Purchase invoice increases supplier payable.
- [x] Payment decreases supplier payable.
- [x] Credit notes and debit notes affect outstanding through voucher rules.
- [x] Add ledger statement.
- [x] Add trial balance.
- [x] Add balance sheet.
- [x] Add profit and loss.
- [ ] Add day book.
- [ ] Add cash book and bank book.
- [x] Add receivables and payables.
- [x] Add GST report foundation.
- [x] Add voucher register.
- [ ] Add audit trail view.

## Phase 6 - Accounts Frontend

- [x] Add Accounts Overview workspace.
- [x] Add Ledgers list/show/upsert workspace using shared design system.
- [x] Add Vouchers list/show/upsert workspace using shared design system.
- [ ] Add Posting Queue/Source Trace view.
- [x] Add Reports menu and report shells.
- [x] Add live reports workspace backed by Accounts API.
- [ ] Required fields use shared required markers, form banner, red field state, and helper text.
- [x] Lists use shared filters, table panel, row actions, status badges, and pagination.
- [ ] Show pages use shared detail cards and activity/audit sections.
- [ ] Reference fields use lookup/autocomplete, not raw IDs.

## Phase 7 - Platform Wiring

- [x] Add Accounts to tenant app workspace switcher.
- [x] Add Accounts to tenant side menu.
- [x] Add Accounts pages to tenant route parsing and title mapping.
- [x] Add Accounts to Super Admin app/catalog surfaces.
- [x] Add Accounts to Project Manager platform registry.
- [x] Add Accounts to Tenant Access/Plan Access module keys.
- [x] Add Accounts in breadcrumb/dropdown workspace navigation.
- [x] Ensure Accounts remains tenant/module activation aware.

## Phase 8 - Tally Integration Readiness

- [x] Add Tally export-ready voucher shape.
- [x] Store Tally sync status per voucher: pending, synced, failed, skipped.
- [x] Store external Tally voucher id/reference when synced.
- [ ] Make sync retryable and auditable.
- [ ] Keep Tally integration downstream of Accounts vouchers only.
- [ ] Never sync Billing documents directly to Tally.

## Phase 9 - Verification

- [ ] Backend module boundary check passes.
- [x] Accounts API typecheck passes.
- [x] Accounts web typecheck passes.
- [x] Platform web typecheck passes after shell wiring.
- [x] Posting engine tests prove balanced vouchers.
- [x] Posting engine tests reject imbalanced vouchers.
- [ ] Ledger balance recalculation tests pass.
- [ ] Billing-to-Accounts contract tests pass for create/update/cancel/delete.
- [ ] UI smoke tests cover Ledgers list/upsert/show and Vouchers list/upsert/show.

## Done Definition

- [x] Accounts has real backend modules, not placeholder files.
- [x] Accounts has real frontend modules, not placeholder screens.
- [x] Billing and Accounts are separated by contracts/events.
- [x] Every posted voucher is balanced.
- [x] Ledger balances are derived from Accounts postings.
- [x] Billing save/update/cancel/delete can be posted or queued to Accounts.
- [x] Tally integration has a clean voucher source to consume next.
