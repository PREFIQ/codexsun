import { sql, type Kysely } from "kysely";
import type { PurchaseSavePayload } from "./purchase.types.js";
import { normalizeSaleInput } from "./purchase.service.js";
import { PurchaseRepository } from "./purchase.repository.js";

export const salesSeed = {
  key: "billing.purchase.seed",
  description: "Purchase module seeds default tenant rows into the configured database."
};

const defaultSales: PurchaseSavePayload[] = [
  {
    billingAddress: "18 Market Road\nCoimbatore - 641018",
    currencyCode: "INR",
    customerEmail: "accounts@northstar.example",
    customerName: "Northstar Trading",
    customerPhone: "+91 98765 43210",
    invoiceNumber: "SAL-0001",
    issuedOn: "2026-07-08",
    items: [
      { colour: "", dcNo: "", description: "Premium cotton fabric", hsnCode: "5208", poNo: "", productName: "Premium cotton fabric", quantity: 25, rate: 320, size: "", taxRate: 12, unit: "MTR" },
      { colour: "", dcNo: "", description: "Finishing and packing", hsnCode: "9988", poNo: "", productName: "Finishing and packing", quantity: 1, rate: 1800, size: "", taxRate: 18, unit: "JOB" },
    ],
    notes: "Dispatch against work order NS-447.",
    roundOff: 0,
    shippingAddress: "18 Market Road\nCoimbatore - 641018",
    status: "confirmed",
  },
  {
    billingAddress: "42 Textile Street\nTiruppur - 641603",
    currencyCode: "INR",
    customerEmail: "ops@cityretail.example",
    customerName: "City Retail",
    customerPhone: "+91 99887 77665",
    invoiceNumber: "SAL-0002",
    issuedOn: "2026-07-09",
    items: [
      { colour: "", dcNo: "", description: "Display rack accessories", hsnCode: "9403", poNo: "", productName: "Display rack accessories", quantity: 4, rate: 1350, size: "", taxRate: 18, unit: "SET" },
      { colour: "", dcNo: "", description: "Store branding labels", hsnCode: "4821", poNo: "", productName: "Store branding labels", quantity: 120, rate: 18, size: "", taxRate: 12, unit: "PCS" },
    ],
    notes: "Draft invoice pending final dispatch quantity.",
    roundOff: 0.2,
    shippingAddress: "42 Textile Street\nTiruppur - 641603",
    status: "draft",
  },
];

export async function seedSalesModule(database: Kysely<any>) {
  const seedDatabase = database as Kysely<any>;
  const repository = new PurchaseRepository();
  const dbNameResult = await sql<{ db: string }>`SELECT DATABASE() as db`.execute(database);
  const databaseName = dbNameResult.rows[0]?.db;
  if (!databaseName) return;

  for (const sale of defaultSales) {
    const normalized = normalizeSaleInput(sale);
    const existing = await repository.list(databaseName);
    const current = existing.find((entry) => entry.invoiceNumber === normalized.invoiceNumber);
    if (current) {
      await repository.update(databaseName, current.id, normalized);
      continue;
    }
    await seedDatabase
      .insertInto("billing_purchase")
      .values({
        amount: 0,
        customer_name: normalized.customerName,
        currency_code: normalized.currencyCode,
        id: `seed-${normalized.invoiceNumber.toLowerCase()}`,
        invoice_number: normalized.invoiceNumber,
        issued_on: normalized.issuedOn,
        status: normalized.status,
      })
      .onDuplicateKeyUpdate({
        customer_name: normalized.customerName,
        issued_on: normalized.issuedOn,
        status: sql`status`,
      })
      .execute();
    await repository.update(databaseName, `seed-${normalized.invoiceNumber.toLowerCase()}`, normalized);
  }
}
