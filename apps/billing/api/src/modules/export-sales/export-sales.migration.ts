import { sql, type Kysely } from "kysely";

export const exportSalesMigration = {
  key: "billing.export-sales.initial",
  description: "Export sales workspace records with item rows and printable invoice fields."
};

export async function migrateExportSalesModule(database: Kysely<any>) {
  await sql.raw(`
    CREATE TABLE IF NOT EXISTS billing_export_sales (
      id varchar(80) primary key,
      invoice_number varchar(80) not null unique,
      customer_name varchar(180) not null,
      customer_email varchar(180) null,
      customer_phone varchar(40) null,
      billing_address text null,
      shipping_address text null,
      amount double precision not null default 0,
      subtotal double precision not null default 0,
      tax_amount double precision not null default 0,
      round_off double precision not null default 0,
      currency_code varchar(8) not null,
      issued_on varchar(16) not null,
      items_json longtext null,
      notes text null,
      status varchar(24) not null,
      work_order_no varchar(120) null,
      tax_type varchar(80) null,
      created_at varchar(40) null,
      updated_at varchar(40) null
    )
  `).execute(database);

  const alterStatements = [
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS customer_email varchar(180) null",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS customer_phone varchar(40) null",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS billing_address text null",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS shipping_address text null",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS subtotal double precision not null default 0",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS tax_amount double precision not null default 0",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS round_off double precision not null default 0",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS items_json longtext null",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS notes text null",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS work_order_no varchar(120) null",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS tax_type varchar(80) null",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS created_at varchar(40) null",
    "ALTER TABLE billing_export_sales ADD COLUMN IF NOT EXISTS updated_at varchar(40) null",
  ];

  for (const statement of alterStatements) {
    await sql.raw(statement).execute(database);
  }
}
