| Field                 | Recommended type     | Rule                                                                                           |
| --------------------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| `id`                  | `INT AUTO_INCREMENT` | Internal primary key                                                                           |
| `uuid`                | `CHAR(8)`            | Unique public identifier                                                                       |
| `invoice_number`      | `VARCHAR(80)`        | Unique per tenant database                                                                     |
| `customer_id`         | `INT NULL`           | Persisted Core Contact reference                                                               |
| `customer_name`       | `VARCHAR(180)`       | Required invoice snapshot                                                                      |
| `billing_address_id`  | `bigint`             | get from contact address foriegn reference                                                     |
| `shipping_address_id` | `bigint`             | get from contact address foriegn reference                                                     |
| `work_order_id`       | `INT NULL`           | Optional persisted reference                                                                   |
| `sales_ledger_id`     | `INT NULL`           | Optional Accounts reference                                                                    |
| `tax_type`            | `VARCHAR(24)`        | `cgst-sgst` or `igst` set this as enum on code base and get from there in future we can extend |
| `currency_code`       | `CHAR(3)`            | Default `INR` get from currencies tabel                                                        |
| `issued_on`           | `DATE`               | Invoice date                                                                                   |
| `subtotal`            | `DECIMAL(18,2)`      | Taxable total                                                                                  |
| `tax_amount`          | `DECIMAL(18,2)`      | GST total                                                                                      |
| `round_off`           | `DECIMAL(18,2)`      | Rounding                                                                                       |
| `amount`              | `DECIMAL(18,2)`      | Final total                                                                                    |
| `terms`               | `TEXT NULL`          | Terms                                                                                          |
| `notes`               | `TEXT NULL`          | Notes                                                                                          |
| `status`              | `VARCHAR(24)`        | Draft/confirmed/cancelled                                                                      |
| `created_at`          | `DATETIME(3)`        | Creation timestamp                                                                             |
| `updated_at`          | `DATETIME(3)`        | Update timestamp                                                                               |
| `deleted_at`          | `DATETIME(3) NULL`   | Only if soft deletion is adopted                                                               |
|                       |                      |                                                                                                |
|                       |                      |                                                                                                |

add company_id and financial_id and make unique with invoice no
add `line_number` | `INT` | Stable display order connect with invoice no to integer

add child table for invoice items
add child table for eway bill and einvoice
add child table for comments
add child table for activities
add child table for entry tools
add child table for payment bill allocation for sales and connect

item table

| Field            | Recommended type     | Rule                         |
| ---------------- | -------------------- | ---------------------------- |
| `id`             | `INT AUTO_INCREMENT` | Internal primary key         |
| `uuid`           | `CHAR(8)`            | Unique public identifier     |
| `sales_id`       | `INT`                | FK to `billing_sales.id`     |
| `line_number`    | `INT`                | Stable display order         |
| `product_id`     | `INT NULL`           | Core Product reference       |
| `description`    | `TEXT`               | Required printed description |
| `hsn_code_id`    | `INT NULL`           | Optional HSN reference       |
| `po_no`          | `VARCHAR(120) NULL`  | Purchase order               |
| `dc_no`          | `VARCHAR(120) NULL`  | Delivery challan             |
| `colour_id`      | `INT NULL`           | Optional Colour reference    |
| `size_id`        | `INT NULL`           | Optional Size reference      |
| `quantity`       | `DECIMAL(18,4)`      | Must be greater than zero    |
| `unit_id`        | `INT NULL`           | Optional Unit reference      |
| `rate`           | `DECIMAL(18,4)`      | Non-negative                 |
| `tax_id`         | `INT NULL`           | Optional Tax reference       |
| `tax_rate`       | `DECIMAL(7,4)`       | GST percentage snapshot      |
| `taxable_amount` | `DECIMAL(18,2)`      | Calculated                   |
| `cgst_amount`    | `DECIMAL(18,2)`      | Calculated                   |
| `sgst_amount`    | `DECIMAL(18,2)`      | Calculated                   |
| `igst_amount`    | `DECIMAL(18,2)`      | Calculated                   |
| `tax_amount`     | `DECIMAL(18,2)`      | Calculated                   |
| `line_total`     | `DECIMAL(18,2)`      | Calculated                   |
| `created_at`     | `DATETIME(3)`        | Creation timestamp           |
| `updated_at`     | `DATETIME(3)`        | Update timestamp             |
