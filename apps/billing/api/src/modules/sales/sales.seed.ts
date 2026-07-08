import { sql, type Kysely } from "kysely";
import type { BillingDatabase } from "../../database/billing-database.js";

export const salesSeed = {
  key: "billing.sales.seed",
  description: "Sales module seeds default tenant rows into the configured database."
};

const defaultSales = [
  { amount: 12500, currencyCode: "INR", customerName: "Northstar Trading", id: "sale-001", invoiceNumber: "SAL-0001", issuedOn: "2026-07-08", status: "confirmed" },
  { amount: 6400, currencyCode: "INR", customerName: "City Retail", id: "sale-002", invoiceNumber: "SAL-0002", issuedOn: "2026-07-08", status: "draft" }
] as const;

export async function seedSalesModule(database: Kysely<BillingDatabase>) {
  for (const sale of defaultSales) {
    await database
      .insertInto("billing_sales")
      .values({
        amount: sale.amount,
        currency_code: sale.currencyCode,
        customer_name: sale.customerName,
        id: sale.id,
        invoice_number: sale.invoiceNumber,
        issued_on: sale.issuedOn,
        status: sale.status
      })
      .onDuplicateKeyUpdate({
        amount: sale.amount,
        currency_code: sale.currencyCode,
        customer_name: sale.customerName,
        issued_on: sale.issuedOn,
        status: sql`status`
      })
      .execute();
  }
}
