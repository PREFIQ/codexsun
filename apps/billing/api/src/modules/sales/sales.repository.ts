import { getBillingDatabase, type BillingSalesTable } from "../../database/billing-database.js";
import type { Sale, SaleSavePayload } from "./sales.types.js";

export class SalesRepository {
  async list(databaseName: string) {
    const rows = await (await getBillingDatabase(databaseName))
      .selectFrom("billing_sales")
      .selectAll()
      .orderBy("issued_on", "desc")
      .execute();
    return rows.map(toSale);
  }

  async create(databaseName: string, input: SaleSavePayload) {
    const sale: Sale = {
      ...input,
      id: `sale-${Date.now()}`
    };
    await (await getBillingDatabase(databaseName)).insertInto("billing_sales").values(toSaleRow(sale)).execute();
    return sale;
  }

  async update(databaseName: string, id: string, input: SaleSavePayload) {
    const db = await getBillingDatabase(databaseName);
    const existing = await db.selectFrom("billing_sales").select("id").where("id", "=", id).executeTakeFirst();
    if (!existing) return null;
    const sale = { ...input, id };
    await db.updateTable("billing_sales").set(toSaleRow(sale)).where("id", "=", id).execute();
    return sale;
  }

  async setStatus(databaseName: string, id: string, status: Sale["status"]) {
    const db = await getBillingDatabase(databaseName);
    const existing = await db.selectFrom("billing_sales").selectAll().where("id", "=", id).executeTakeFirst();
    if (!existing) return null;
    await db.updateTable("billing_sales").set({ status }).where("id", "=", id).execute();
    return { ...toSale(existing), status };
  }
}

function toSale(row: BillingSalesTable): Sale {
  return {
    amount: Number(row.amount),
    currencyCode: row.currency_code,
    customerName: row.customer_name,
    id: row.id,
    invoiceNumber: row.invoice_number,
    issuedOn: row.issued_on,
    status: row.status
  };
}

function toSaleRow(sale: Sale): BillingSalesTable {
  return {
    amount: sale.amount,
    currency_code: sale.currencyCode,
    customer_name: sale.customerName,
    id: sale.id,
    invoice_number: sale.invoiceNumber,
    issued_on: sale.issuedOn,
    status: sale.status
  };
}
