import { sql, type Kysely } from "kysely";

export async function migrateQuotationModule(database: Kysely<any>) {
  await sql.raw(`
    CREATE TABLE IF NOT EXISTS billing_quotations (
      id varchar(80) primary key,
      quotation_number varchar(80) not null unique,
      customer_name varchar(180) not null,
      work_order_no varchar(120) null,
      sales_ledger varchar(180) null,
      tax_type varchar(24) not null,
      billing_address text null,
      shipping_address text null,
      amount double precision not null default 0,
      subtotal double precision not null default 0,
      tax_amount double precision not null default 0,
      round_off double precision not null default 0,
      date varchar(16) not null,
      items_json longtext null,
      notes text null,
      terms text null,
      status varchar(24) not null,
      generated_sales_invoice_no varchar(120) null,
      created_at varchar(40) null,
      updated_at varchar(40) null
    )
  `).execute(database);

  await sql.raw(`
    ALTER TABLE billing_quotations
      ADD COLUMN IF NOT EXISTS sales_ledger varchar(180) null AFTER work_order_no
  `).execute(database);
}
