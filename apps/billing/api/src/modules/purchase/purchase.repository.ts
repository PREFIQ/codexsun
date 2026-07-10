import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import type { Purchase, PurchaseSavePayload, PurchaseStatus } from "./purchase.types.js";

type PurchaseTableRow = {
  amount: number;
  billing_address: string | null;
  created_at: string | null;
  currency_code: string;
  customer_email: string | null;
  customer_name: string;
  customer_phone: string | null;
  id: string;
  invoice_number: string;
  issued_on: string;
  items_json: string | null;
  notes: string | null;
  round_off: number | null;
  shipping_address: string | null;
  status: PurchaseStatus;
  subtotal: number | null;
  supplier_bill_date: string | null;
  supplier_bill_no: string | null;
  tax_amount: number | null;
  tax_type: string | null;
  updated_at: string | null;
  work_order_no: string | null;
};

type PurchaseDatabase = {
  billing_purchase: PurchaseTableRow;
};

export class PurchaseRepository {
  async list(databaseName: string) {
    const rows = await (await purchaseDatabase(databaseName))
      .selectFrom("billing_purchase")
      .selectAll()
      .orderBy("issued_on", "desc")
      .orderBy("invoice_number", "desc")
      .execute();
    return rows.map(toPurchase);
  }

  async get(databaseName: string, id: string) {
    const row = await (await purchaseDatabase(databaseName))
      .selectFrom("billing_purchase")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toPurchase(row) : null;
  }

  async create(databaseName: string, input: PurchaseSavePayload) {
    const sale = createPurchaseRecord(input);
    await (await purchaseDatabase(databaseName)).insertInto("billing_purchase").values(toPurchaseRow(sale)).execute();
    return sale;
  }

  async update(databaseName: string, id: string, input: PurchaseSavePayload) {
    const db = await purchaseDatabase(databaseName);
    const existing = await db.selectFrom("billing_purchase").select("id").where("id", "=", id).executeTakeFirst();
    if (!existing) return null;
    const sale = createPurchaseRecord(input, { id });
    await db.updateTable("billing_purchase").set(toPurchaseRow(sale)).where("id", "=", id).execute();
    return sale;
  }

  async setStatus(databaseName: string, id: string, status: Purchase["status"]) {
    const db = await purchaseDatabase(databaseName);
    const existing = await db.selectFrom("billing_purchase").selectAll().where("id", "=", id).executeTakeFirst();
    if (!existing) return null;
    const updatedAt = new Date().toISOString();
    await db.updateTable("billing_purchase").set({ status, updated_at: updatedAt }).where("id", "=", id).execute();
    return { ...toPurchase(existing), status, updatedAt };
  }
}

function purchaseDatabase(databaseName: string) {
  return getBillingDatabase(databaseName) as unknown as Promise<Kysely<PurchaseDatabase>>;
}

function toPurchase(row: PurchaseTableRow): Purchase {
  const items = parseItems(row.items_json);
  return {
    amount: Number(row.amount),
    billingAddress: row.billing_address ?? "",
    createdAt: row.created_at ?? "",
    currencyCode: row.currency_code,
    customerEmail: row.customer_email ?? "",
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? "",
    id: row.id,
    invoiceNumber: row.invoice_number,
    issuedOn: row.issued_on,
    items,
    notes: row.notes ?? "",
    roundOff: Number(row.round_off ?? 0),
    shippingAddress: row.shipping_address ?? "",
    status: row.status,
    subtotal: Number(row.subtotal ?? items.reduce((sum, item) => sum + item.taxableAmount, 0)),
    supplierBillDate: row.supplier_bill_date ?? "",
    supplierBillNo: row.supplier_bill_no ?? "",
    taxAmount: Number(row.tax_amount ?? items.reduce((sum, item) => sum + item.taxAmount, 0)),
    taxType: row.tax_type ?? "CGST + SGST",
    updatedAt: row.updated_at ?? row.created_at ?? "",
    workOrderNo: row.work_order_no ?? "",
  };
}

function toPurchaseRow(sale: Purchase): PurchaseTableRow {
  return {
    amount: sale.amount,
    billing_address: sale.billingAddress,
    created_at: sale.createdAt,
    currency_code: sale.currencyCode,
    customer_email: sale.customerEmail,
    customer_name: sale.customerName,
    customer_phone: sale.customerPhone,
    id: sale.id,
    invoice_number: sale.invoiceNumber,
    issued_on: sale.issuedOn,
    items_json: JSON.stringify(sale.items),
    notes: sale.notes,
    round_off: sale.roundOff,
    shipping_address: sale.shippingAddress,
    status: sale.status,
    subtotal: sale.subtotal,
    supplier_bill_date: sale.supplierBillDate,
    supplier_bill_no: sale.supplierBillNo,
    tax_amount: sale.taxAmount,
    tax_type: sale.taxType,
    updated_at: sale.updatedAt,
    work_order_no: sale.workOrderNo,
  };
}

function createPurchaseRecord(input: PurchaseSavePayload, current?: Partial<Pick<Purchase, "createdAt" | "id">>) {
  const now = new Date().toISOString();
  const totals = buildPurchaseTotals(input);
  return {
    amount: totals.amount,
    billingAddress: input.billingAddress,
    createdAt: current?.createdAt ?? now,
    currencyCode: input.currencyCode,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    id: current?.id ?? `purchase-${randomUUID().slice(0, 8)}`,
    invoiceNumber: input.invoiceNumber,
    issuedOn: input.issuedOn,
    items: totals.items,
    notes: input.notes,
    roundOff: Number(input.roundOff ?? 0),
    shippingAddress: input.shippingAddress,
    status: input.status,
    subtotal: totals.subtotal,
    supplierBillDate: input.supplierBillDate ?? "",
    supplierBillNo: input.supplierBillNo ?? "",
    taxAmount: totals.taxAmount,
    taxType: input.taxType ?? "CGST + SGST",
    updatedAt: now,
    workOrderNo: input.workOrderNo ?? "",
  } satisfies Purchase;
}

function parseItems(value: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildPurchaseTotals(input: PurchaseSavePayload) {
  const items = input.items.map((item, index) => {
    const taxableAmount = roundMoney(item.quantity * item.rate);
    const taxAmount = roundMoney(taxableAmount * item.taxRate / 100);
    return {
      ...item,
      id: `item-${index + 1}`,
      lineTotal: roundMoney(taxableAmount + taxAmount),
      taxableAmount,
      taxAmount,
    };
  });

  const subtotal = roundMoney(items.reduce((total, item) => total + item.taxableAmount, 0));
  const taxAmount = roundMoney(items.reduce((total, item) => total + item.taxAmount, 0));
  const amount = roundMoney(subtotal + taxAmount + Number(input.roundOff ?? 0));

  return { amount, items, subtotal, taxAmount };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
