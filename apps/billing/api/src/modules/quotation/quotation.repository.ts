import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import type { Quotation, QuotationLineItem, QuotationSavePayload, QuotationStatus, QuotationTaxType } from "./quotation.types.js";

type BillingQuotationRow = {
  amount: number;
  billing_address: string | null;
  created_at: string | null;
  customer_name: string;
  date: string;
  generated_sales_invoice_no: string | null;
  id: string;
  items_json: string | null;
  notes: string | null;
  quotation_number: string;
  round_off: number | null;
  sales_ledger: string | null;
  shipping_address: string | null;
  status: QuotationStatus;
  subtotal: number | null;
  tax_amount: number | null;
  tax_type: QuotationTaxType;
  terms: string | null;
  updated_at: string | null;
  work_order_no: string | null;
};

type BillingQuotationDatabase = {
  billing_quotations: BillingQuotationRow;
};

export class QuotationRepository {
  async list(databaseName: string) {
    const rows = await (await database(databaseName))
      .selectFrom("billing_quotations")
      .selectAll()
      .orderBy("date", "desc")
      .orderBy("quotation_number", "desc")
      .execute();
    return rows.map(toQuotation);
  }

  async get(databaseName: string, id: string) {
    const row = await (await database(databaseName))
      .selectFrom("billing_quotations")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toQuotation(row) : null;
  }

  async findByNumber(databaseName: string, quotationNumber: string) {
    const row = await (await database(databaseName))
      .selectFrom("billing_quotations")
      .selectAll()
      .where("quotation_number", "=", quotationNumber)
      .executeTakeFirst();
    return row ? toQuotation(row) : null;
  }

  async create(databaseName: string, input: QuotationSavePayload) {
    const record = createQuotationRecord(input);
    await (await database(databaseName)).insertInto("billing_quotations").values(toRow(record)).execute();
    return record;
  }

  async update(databaseName: string, id: string, input: QuotationSavePayload) {
    const db = await database(databaseName);
    const existing = await db.selectFrom("billing_quotations").select(["id", "created_at"]).where("id", "=", id).executeTakeFirst();
    if (!existing) return null;
    const record = createQuotationRecord(input, { createdAt: existing.created_at ?? new Date().toISOString(), id });
    await db.updateTable("billing_quotations").set(toRow(record)).where("id", "=", id).execute();
    return record;
  }

  async delete(databaseName: string, id: string) {
    const db = await database(databaseName);
    const existing = await db.selectFrom("billing_quotations").selectAll().where("id", "=", id).executeTakeFirst();
    if (!existing) return null;
    await db.deleteFrom("billing_quotations").where("id", "=", id).execute();
    return toQuotation(existing);
  }

  async setStatus(databaseName: string, id: string, status: QuotationStatus) {
    const db = await database(databaseName);
    const existing = await db.selectFrom("billing_quotations").selectAll().where("id", "=", id).executeTakeFirst();
    if (!existing) return null;
    const updatedAt = new Date().toISOString();
    await db.updateTable("billing_quotations").set({ status, updated_at: updatedAt }).where("id", "=", id).execute();
    return { ...toQuotation(existing), status, updatedAt };
  }

  async setGeneratedSalesInvoice(databaseName: string, id: string, invoiceNumber: string) {
    const db = await database(databaseName);
    const existing = await db.selectFrom("billing_quotations").selectAll().where("id", "=", id).executeTakeFirst();
    if (!existing) return null;
    const updatedAt = new Date().toISOString();
    await db.updateTable("billing_quotations").set({
      generated_sales_invoice_no: invoiceNumber,
      status: "confirmed",
      updated_at: updatedAt,
    }).where("id", "=", id).execute();
    return { ...toQuotation(existing), generatedSalesInvoiceNo: invoiceNumber, status: "confirmed" as const, updatedAt };
  }
}

function database(databaseName: string) {
  return getBillingDatabase(databaseName) as unknown as Promise<Kysely<BillingQuotationDatabase>>;
}

function toQuotation(row: BillingQuotationRow): Quotation {
  const items = parseItems(row.items_json);
  return {
    amount: Number(row.amount),
    billingAddress: row.billing_address ?? "",
    createdAt: row.created_at ?? "",
    customerName: row.customer_name,
    date: row.date,
    generatedSalesInvoiceNo: row.generated_sales_invoice_no ?? "",
    id: row.id,
    items,
    notes: row.notes ?? "",
    quotationNumber: row.quotation_number,
    roundOff: Number(row.round_off ?? 0),
    salesLedger: row.sales_ledger ?? "",
    shippingAddress: row.shipping_address ?? "",
    status: row.status,
    subtotal: Number(row.subtotal ?? items.reduce((sum, item) => sum + item.taxableAmount, 0)),
    taxAmount: Number(row.tax_amount ?? items.reduce((sum, item) => sum + item.taxAmount, 0)),
    taxType: row.tax_type,
    terms: row.terms ?? "",
    updatedAt: row.updated_at ?? row.created_at ?? "",
    workOrderNo: row.work_order_no ?? "",
  };
}

function toRow(quotation: Quotation): BillingQuotationRow {
  return {
    amount: quotation.amount,
    billing_address: quotation.billingAddress,
    created_at: quotation.createdAt,
    customer_name: quotation.customerName,
    date: quotation.date,
    generated_sales_invoice_no: quotation.generatedSalesInvoiceNo || null,
    id: quotation.id,
    items_json: JSON.stringify(quotation.items),
    notes: quotation.notes,
    quotation_number: quotation.quotationNumber,
    round_off: quotation.roundOff,
    sales_ledger: quotation.salesLedger,
    shipping_address: quotation.shippingAddress,
    status: quotation.status,
    subtotal: quotation.subtotal,
    tax_amount: quotation.taxAmount,
    tax_type: quotation.taxType,
    terms: quotation.terms,
    updated_at: quotation.updatedAt,
    work_order_no: quotation.workOrderNo,
  };
}

function createQuotationRecord(input: QuotationSavePayload, current?: Partial<Pick<Quotation, "createdAt" | "id">>) {
  const now = new Date().toISOString();
  const totals = buildTotals(input);
  return {
    amount: totals.amount,
    billingAddress: input.billingAddress,
    createdAt: current?.createdAt ?? now,
    customerName: input.customerName,
    date: input.date,
    generatedSalesInvoiceNo: "",
    id: current?.id ?? `quotation-${randomUUID().slice(0, 8)}`,
    items: totals.items,
    notes: input.notes,
    quotationNumber: input.quotationNumber,
    roundOff: Number(input.roundOff ?? 0),
    salesLedger: input.salesLedger,
    shippingAddress: input.shippingAddress,
    status: input.status,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    taxType: input.taxType,
    terms: input.terms,
    updatedAt: now,
    workOrderNo: input.workOrderNo,
  } satisfies Quotation;
}

function buildTotals(input: QuotationSavePayload) {
  const isSplitTax = input.taxType !== "igst";
  const items: QuotationLineItem[] = input.items.map((item, index) => {
    const taxableAmount = roundMoney(item.quantity * item.rate);
    const taxAmount = roundMoney((taxableAmount * item.taxRate) / 100);
    const splitTaxAmount = roundMoney(taxAmount / 2);
    return {
      ...item,
      cgstAmount: isSplitTax ? splitTaxAmount : 0,
      id: `item-${index + 1}`,
      igstAmount: isSplitTax ? 0 : taxAmount,
      lineTotal: roundMoney(taxableAmount + taxAmount),
      sgstAmount: isSplitTax ? splitTaxAmount : 0,
      taxableAmount,
      taxAmount,
    };
  });
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.taxableAmount, 0));
  const taxAmount = roundMoney(items.reduce((sum, item) => sum + item.taxAmount, 0));
  const amount = roundMoney(subtotal + taxAmount + Number(input.roundOff ?? 0));
  return { amount, items, subtotal, taxAmount };
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

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
