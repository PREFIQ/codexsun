# Task 19 - Tenant Common And Master Data Modules From CXSUN Reference

## Command For Agent

Build tenant common and master data modules in CODEXSUN using CXSUN only as the reference for field shape and UX rhythm. Start by checking existing CODEXSUN common/master modules and continue their local pattern. Implement each common module as a separate module/table/route/page; do not merge common modules into one combined module. Reuse CODEXSUN UI primitives where available, borrow only UX behavior from CXSUN, and do not paste CXSUN business logic directly.

## Batch State

| Field | Value |
| --- | --- |
| Task reference | `task_19` |
| Status | `planned` |
| Source reference | `E:\Workspace\cxsun` |
| Target workspace | `E:\Workspace\prefiq\codexsun` |
| Focus | Tenant common modules, contact/product/work-order master modules, autocomplete, active badge/card UX |
| Last updated | `2026-06-30` |

## Reference Confirmation

CXSUN already has these modules and UX patterns:

- Common module registry: `E:\Workspace\cxsun\apps\billing\src\modules\common\registry.ts`
- Common definition-driven migration: `E:\Workspace\cxsun\apps\billing\src\modules\foundation\master-record\database\migrations\master-record.migration.ts`
- Common autocomplete with create: `E:\Workspace\cxsun\apps\frontend\src\features\master-data\interface\components\common-record-autocomplete-lookup.tsx`
- Product autocomplete with popup create: `E:\Workspace\cxsun\apps\frontend\src\features\master-data\interface\components\product-autocomplete.tsx`
- Work order autocomplete with popup create: `E:\Workspace\cxsun\apps\frontend\src\features\master-data\interface\components\work-order-autocomplete.tsx`
- Common list UX: `E:\Workspace\cxsun\apps\frontend\src\components\blocks\lists\common-list.tsx`
- Master list UX: `E:\Workspace\cxsun\apps\frontend\src\components\blocks\lists\master-list.tsx`
- Contact page UX: `E:\Workspace\cxsun\apps\frontend\src\features\contact\contact-page.tsx`
- Product page UX: `E:\Workspace\cxsun\apps\frontend\src\features\product\product-page.tsx`

CODEXSUN already has reusable workspace UI pieces that must be preferred over copying CXSUN code:

- `packages/ui/src/workspace/page.tsx`
- `packages/ui/src/workspace/table.tsx`
- `packages/ui/src/workspace/show.tsx`
- `packages/ui/src/workspace/upsert.tsx`
- `packages/ui/src/workspace/autocomplete.tsx`
- Current tenant master placeholders: `apps/platform/web/src/pages/tenant/MasterDataPage.tsx` and `apps/platform/web/src/pages/tenant/MasterRecordsPage.tsx`

## Non-Negotiable Rules

- Check existing CODEXSUN module, route, database, service, and UI patterns first. Continue that pattern.
- Do not merge common modules. Every common module must stay separate in code and database ownership, even if it uses a shared generic UI component.
- Common modules use list plus popup upsert.
- Contact, product, and work order use list plus show plus upsert.
- Add autocomplete behavior like CXSUN: search existing records, keyboard navigation, select record, optional create from lookup, update query cache after create.
- Add active status as a visible badge on lists and show pages, and an active toggle/card in upsert forms for all modules.
- UX may reuse CXSUN ideas: list toolbar, column menu, filters, pagination, row actions, active badge/card, popup upsert, autocomplete dropdown. Do not reuse CXSUN backend/business logic blindly.
- Keep tenant isolation explicit. All records belong to the selected tenant database/context.
- Use path routing, not query-string module switching.

## Database Contract

Common and master tables follow the CXSUN master-record base columns:

| Column | SQL Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | `INT AUTO_INCREMENT PRIMARY KEY` | yes | Internal numeric id |
| `uuid` | `CHAR(8) UNIQUE` | yes | Public id |
| module columns | see module tables below | varies | Per definition |
| `is_active` | `TINYINT(1)` | yes | Default `1` |
| `created_at` | `DATETIME` | yes | Default current timestamp |
| `updated_at` | `DATETIME` | yes | Default current timestamp |
| `deleted_at` | `DATETIME NULL` | no | Soft delete marker |

Type mapping from CXSUN:

| Definition Type | SQL Type |
| --- | --- |
| `string` | `VARCHAR(255)` |
| `number` integer | `INT` |
| `number` decimal | `DOUBLE` |
| `boolean` | `TINYINT(1)` |
| `date` | `DATE` |

## Common Modules To Build Separately

Each row below must become its own common module with its own table, migration/definition, route/service/repository registration, tenant API endpoint, list page, popup upsert, active badge, and autocomplete availability where useful.

| Group | Key | Label | Table | Sort | Fields |
| --- | --- | --- | --- | --- | --- |
| location | `countries` | Countries | `common_countries` | `name` | `name` string required, `code` string required, `phone_code` string nullable |
| location | `states` | States | `common_states` | `name` | `name` string required, `code` string required, `country_id` integer required |
| location | `districts` | Districts | `common_districts` | `name` | `name` string required, `state_id` integer required |
| location | `cities` | Cities | `common_cities` | `name` | `name` string required, `district_id` integer required |
| location | `pincodes` | Pincodes | `common_pincodes` | `name` | `name` string required |
| contacts | `contactGroups` | Contact Groups | `common_contact_groups` | `name` | `name` string required |
| contacts | `contactTypes` | Contact Types | `common_contact_types` | `name` | `name` string required |
| contacts | `addressTypes` | Address Types | `common_address_types` | `name` | `name` string required |
| contacts | `bankNames` | Bank Names | `common_bank_names` | `name` | `name` string required |
| product | `productGroups` | Product Groups | `common_product_groups` | `name` | `name` string required |
| product | `productCategories` | Product Categories | `common_product_categories` | `name` | `name` string required |
| product | `productTypes` | Product Types | `common_product_types` | `name` | `name` string required |
| product | `units` | Units | `common_units` | `name` | `name` string required |
| product | `hsnCodes` | HSN Codes | `common_hsn_codes` | `code` | `code` string required, `description` string required |
| product | `taxes` | Taxes | `common_taxes` | `rate_percent` | `rate_percent` decimal required, `description` string required |
| product | `brands` | Brands | `common_brands` | `name` | `name` string required |
| product | `colours` | Colours | `common_colours` | `name` | `name` string required |
| product | `sizes` | Sizes | `common_sizes` | `name` | `name` string required |
| product | `styles` | Styles | `common_styles` | `name` | `name` string required |
| orders | `orderTypes` | Order Types | `common_order_types` | `name` | `name` string required |
| orders | `transports` | Transports | `common_transports` | `name` | `name` string required, `gst` string nullable, `vehicle_no` string nullable, `address` string nullable, `contact_no` string nullable, `contact_person` string nullable |
| orders | `warehouses` | Warehouses | `common_warehouses` | `name` | `name` string required |
| orders | `destinations` | Destinations | `common_destinations` | `name` | `name` string required |
| orders | `stockRejectionTypes` | Stock Rejection Types | `common_stock_rejection_types` | `name` | `name` string required |
| others | `currencies` | Currencies | `common_currencies` | `name` | `name` string required |
| others | `priorities` | Priorities | `common_priorities` | `name` | `name` string required, `colour` string required, `tag` string required |
| others | `paymentTerms` | Payment Terms | `common_payment_terms` | `name` | `name` string required |
| others | `accountingYear` | Accounting Year | `accounting_years` | `name` | `name` string required, `start_date` date required, `end_date` date required, `books_start` date required, `is_current_year` boolean required |
| others | `months` | Months | `common_months` | `name` | `name` string required |
| others | `salesAccountTypes` | Sales Types | `common_sales_account_types` | `name` | `name` string required, `description` string nullable |

## Master Modules To Build

### Contact Master

Primary table: `masters_contacts`

Fields:

- Base fields: `id`, `uuid`, `is_active`, `created_at`, `updated_at`, `deleted_at`
- `code` string required
- `name` string required
- `contact_type_id` string nullable
- `ledger_id` string nullable
- `ledger_name` string nullable
- `legal_name` string nullable
- `pan` string nullable
- `gstin` string nullable
- `msme_type` string nullable
- `msme_no` string nullable
- `tan` string nullable
- `tds_available` boolean nullable/default false
- `tcs_available` boolean nullable/default false
- `opening_balance` decimal nullable
- `balance_type` string nullable
- `credit_limit` decimal nullable
- `website` string nullable
- `primary_email` string nullable
- `primary_phone` string nullable
- `description` string nullable

Sequence table:

- `contact_code_sequences`
- `sequence_key` `VARCHAR(80)` primary key
- `next_number` `INT UNSIGNED` required
- `updated_at` `DATETIME` default current timestamp on update

Related contact child data to support or verify:

- `address_book`: `id`, `uuid`, `owner_type`, `owner_id`, `address_type_id`, `address_line1`, `address_line2`, `city_id`, `district_id`, `state_id`, `country_id`, `pincode_id`, `latitude`, `longitude`, `is_default`, `is_active`, `created_at`, `updated_at`
- `contact_emails`: `id`, `uuid`, `contact_id`, `email`, `email_type`, `is_primary`, `is_active`, `created_at`, `updated_at`
- `contact_phones`: `id`, `uuid`, `contact_id`, `phone_number`, `phone_type`, `is_primary`, `is_active`, `created_at`, `updated_at`
- `contact_social_links`: `id`, `uuid`, `contact_id`, `platform`, `url`, `is_active`, `created_at`, `updated_at`
- `contact_bank_accounts`: `id`, `uuid`, `contact_id`, `bank_name`, `account_number`, `account_holder_name`, `ifsc`, `branch`, `is_primary`, `is_active`, `created_at`, `updated_at`
- `contact_gst_details`: `id`, `uuid`, `contact_id`, `gstin`, `state`, `is_default`, `is_active`, `created_at`, `updated_at`

UI/API requirement:

- List page with search, status filter, column visibility, pagination, row actions, active/suspended badge.
- Show page with profile, compliance, accounts, addresses, emails, phones, bank accounts, social links, GST details, timestamps.
- Upsert page with grouped/tabs layout, common-record autocomplete for contact type, address type, bank name, country/state/district/city/pincode, active toggle/card, and save/cancel actions.
- Create/update should return the saved record and navigate to show.
- Suspend/restore should soft-delete and update active badge.

### Product Master

Primary table: `masters_products`

Fields:

- Base fields: `id`, `uuid`, `is_active`, `created_at`, `updated_at`, `deleted_at`
- `code` string required
- `name` string required
- `product_type_id` integer nullable
- `hsn_code_id` integer nullable
- `unit_id` integer nullable
- `tax_id` integer nullable

UI/API requirement:

- List page with search over name, code, product type, HSN, unit, GST, status; status filter; columns; pagination; row actions; active badge.
- Show page with details and timestamps.
- Upsert page with fields for name, code, product type, HSN code, unit, GST, active toggle/card.
- Use common-record autocomplete for `productTypes`, `hsnCodes`, `units`, and `taxes`.
- Add product autocomplete for other forms: lookup products, select by code/name, create in popup when missing.

### Work Order Master

CXSUN names this module `orders` but labels it `Work Orders`.

Primary table: `masters_orders`

Fields:

- Base fields: `id`, `uuid`, `is_active`, `created_at`, `updated_at`, `deleted_at`
- `code` string required
- `name` string required
- `description` string nullable

UI/API requirement:

- List page with search over code, name, description, status; status filter; columns; pagination; row actions; active badge.
- Show page with details and timestamps.
- Upsert page with code, name, description, active toggle/card.
- Add work-order autocomplete for other forms: lookup work orders, select by code/name, create in popup when missing.

## Backend Build Instructions

1. Inspect CODEXSUN tenant database/migration style first. If a generic master-record foundation already exists, extend it. If it does not, add a small definition-driven foundation compatible with CODEXSUN style.
2. Create one definition per common module. Keep file/folder ownership separate by group/module.
3. Register common modules centrally, but do not collapse their database ownership into one table.
4. Add tenant APIs for every common module:
   - list
   - show
   - create/update upsert
   - suspend/delete
   - restore
5. Add tenant APIs for contact, product, and work order:
   - list
   - show
   - create/update upsert
   - suspend/delete
   - restore
   - contact next-code
6. Validate required fields and return clear validation errors.
7. Keep tenant context explicit in every repository/service call.
8. Add seed data only where it is safe and expected: countries, states, contact types, address types, units, HSN/GST examples, months, accounting year, order types, priorities.

## Frontend Build Instructions

1. Build a common module index page grouped by Location, Contacts, Product, Orders, Others.
2. Each common module opens as a separate route/page and uses list plus popup upsert.
3. Popup upsert must support all fields for that module, not only `name`.
4. Every list row must show active/suspended badge and row actions.
5. Every upsert form must include an active toggle/card with badge-like styling.
6. Add shared autocomplete components:
   - common record autocomplete with optional inline create
   - product autocomplete with popup create
   - work-order autocomplete with popup create
7. Build contact/product/work-order pages as list plus show plus upsert. Do not put these masters inside the generic common module page.
8. Use CODEXSUN `@codexsun/ui` workspace components first. Recreate missing CXSUN UX behaviors only when CODEXSUN does not already have them.

## Routing Expectations

Use stable path routes. Suggested routes:

- `/tenant/common`
- `/tenant/common/countries`
- `/tenant/common/states`
- `/tenant/common/districts`
- `/tenant/common/cities`
- `/tenant/common/pincodes`
- `/tenant/common/contact-types`
- `/tenant/common/contact-groups`
- `/tenant/common/address-types`
- `/tenant/common/bank-names`
- `/tenant/common/product-groups`
- `/tenant/common/product-categories`
- `/tenant/common/product-types`
- `/tenant/common/units`
- `/tenant/common/hsn-codes`
- `/tenant/common/taxes`
- `/tenant/common/brands`
- `/tenant/common/colours`
- `/tenant/common/sizes`
- `/tenant/common/styles`
- `/tenant/common/order-types`
- `/tenant/common/transports`
- `/tenant/common/warehouses`
- `/tenant/common/destinations`
- `/tenant/common/stock-rejection-types`
- `/tenant/common/currencies`
- `/tenant/common/priorities`
- `/tenant/common/payment-terms`
- `/tenant/common/accounting-year`
- `/tenant/common/months`
- `/tenant/common/sales-account-types`
- `/tenant/masters/contacts`
- `/tenant/masters/contacts/:id`
- `/tenant/masters/contacts/new`
- `/tenant/masters/contacts/:id/edit`
- `/tenant/masters/products`
- `/tenant/masters/products/:id`
- `/tenant/masters/products/new`
- `/tenant/masters/products/:id/edit`
- `/tenant/masters/work-orders`
- `/tenant/masters/work-orders/:id`
- `/tenant/masters/work-orders/new`
- `/tenant/masters/work-orders/:id/edit`

## Acceptance Criteria

- Every common module listed above exists separately and is not merged into a generic single database table.
- Common list plus popup upsert works for every common module.
- Contact, product, and work order list plus show plus upsert works.
- Autocomplete works like CXSUN: search, keyboard navigation, select, optional popup/inline create, cache refresh after create.
- Active badge appears in every list and show page.
- Active toggle/card appears in every upsert form.
- Suspend/restore updates list, show, and badge state.
- Typecheck passes.
- Lint passes.
- API tests cover list/show/upsert/suspend/restore and validation failures for common modules and the three master modules.
- Frontend tests or Playwright smoke checks cover common popup upsert and master list/show/upsert.
- Documentation/changelog mention the new tenant common/master module foundation.

## Completion Checklist

- [ ] Existing CODEXSUN common/master implementation checked and followed.
- [ ] Common module foundation added or extended.
- [ ] All common module definitions/migrations added separately.
- [ ] All common module APIs added.
- [ ] Common module index and pages added.
- [ ] Popup upsert added for common modules.
- [ ] Contact master database/API/UI added.
- [ ] Product master database/API/UI added.
- [ ] Work order master database/API/UI added.
- [ ] Common record autocomplete added.
- [ ] Product autocomplete added.
- [ ] Work order autocomplete added.
- [ ] Active badge and active upsert card added everywhere.
- [ ] Tests added and passing.
- [ ] Changelog updated.
