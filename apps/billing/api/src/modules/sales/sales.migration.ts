import { sql, type Kysely } from "kysely";

export const salesMigration = {
  key: "billing.sales.initial",
  description: "Sales workspace records with item rows and printable invoice fields."
};

export async function migrateSalesModule(database: Kysely<any>) {
  await sql.raw(`
    CREATE TABLE IF NOT EXISTS billing_sales (
      id varchar(80) primary key,
      invoice_number varchar(80) not null unique,
      customer_name varchar(180) not null,
      customer_email varchar(180) null,
      customer_phone varchar(40) null,
      eway_json longtext null,
      einvoice_json longtext null,
      billing_address text null,
      shipping_address text null,
      sales_ledger varchar(180) null,
      tax_type varchar(24) not null default 'cgst-sgst',
      terms text null,
      work_order_no varchar(180) null,
      amount double precision not null default 0,
      subtotal double precision not null default 0,
      tax_amount double precision not null default 0,
      round_off double precision not null default 0,
      currency_code varchar(8) not null,
      issued_on varchar(16) not null,
      items_json longtext null,
      notes text null,
      status varchar(24) not null,
      created_at varchar(40) null,
      updated_at varchar(40) null
    )
  `).execute(database);

  const alterStatements = [
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS customer_email varchar(180) null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS customer_phone varchar(40) null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS eway_json longtext null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS einvoice_json longtext null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS billing_address text null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS shipping_address text null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS sales_ledger varchar(180) null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS tax_type varchar(24) not null default 'cgst-sgst'",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS terms text null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS work_order_no varchar(180) null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS subtotal double precision not null default 0",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS tax_amount double precision not null default 0",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS round_off double precision not null default 0",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS items_json longtext null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS notes text null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS created_at varchar(40) null",
    "ALTER TABLE billing_sales ADD COLUMN IF NOT EXISTS updated_at varchar(40) null",
  ];

  for (const statement of alterStatements) {
    await sql.raw(statement).execute(database);
  }
}
