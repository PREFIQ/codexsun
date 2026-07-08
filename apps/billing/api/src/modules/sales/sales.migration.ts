import type { Kysely } from "kysely";
import type { BillingDatabase } from "../../database/billing-database.js";

export const salesMigration = {
  key: "billing.sales.initial",
  description: "Initial sales module contract for the Billing app."
};

export async function migrateSalesModule(database: Kysely<BillingDatabase>) {
  await database.schema
    .createTable("billing_sales")
    .ifNotExists()
    .addColumn("id", "varchar(80)", (col) => col.primaryKey())
    .addColumn("invoice_number", "varchar(80)", (col) => col.notNull().unique())
    .addColumn("customer_name", "varchar(180)", (col) => col.notNull())
    .addColumn("amount", "double precision", (col) => col.notNull().defaultTo(0))
    .addColumn("currency_code", "varchar(8)", (col) => col.notNull())
    .addColumn("issued_on", "varchar(16)", (col) => col.notNull())
    .addColumn("status", "varchar(24)", (col) => col.notNull())
    .execute();
}
