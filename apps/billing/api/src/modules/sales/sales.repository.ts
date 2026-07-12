import { randomUUID } from "node:crypto";
import type { Kysely } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import type {
  Sale,
  SaleEinvoiceDetails,
  SaleEwayDetails,
  SaleSavePayload,
  SaleStatus
} from "./sales.types.js";

type SalesTableRow = {
  amount: number;
  billing_address: string | null;
  created_at: string | null;
  currency_code: string;
  customer_email: string | null;
  customer_name: string;
  customer_phone: string | null;
  eway_json: string | null;
  einvoice_json: string | null;
  id: string;
  invoice_number: string;
  issued_on: string;
  items_json: string | null;
  notes: string | null;
  round_off: number | null;
  shipping_address: string | null;
  sales_ledger: string | null;
  status: SaleStatus;
  subtotal: number | null;
  tax_amount: number | null;
  tax_type: "cgst-sgst" | "igst";
  terms: string | null;
  updated_at: string | null;
  work_order_no: string | null;
};

type SalesDatabase = {
  billing_sales: SalesTableRow;
};

export class SalesRepository {
  async list(databaseName: string) {
    const rows = await (
      await salesDatabase(databaseName)
    )
      .selectFrom("billing_sales")
      .selectAll()
      .orderBy("issued_on", "desc")
      .orderBy("invoice_number", "desc")
      .execute();
    return rows.map(toSale);
  }

  async get(databaseName: string, id: string) {
    const row = await (
      await salesDatabase(databaseName)
    )
      .selectFrom("billing_sales")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toSale(row) : null;
  }

  async findByInvoiceNumber(databaseName: string, invoiceNumber: string) {
    const row = await (
      await salesDatabase(databaseName)
    )
      .selectFrom("billing_sales")
      .selectAll()
      .where("invoice_number", "=", invoiceNumber)
      .executeTakeFirst();
    return row ? toSale(row) : null;
  }

  async create(databaseName: string, input: SaleSavePayload) {
    const sale = createSaleRecord(input);
    await (
      await salesDatabase(databaseName)
    )
      .insertInto("billing_sales")
      .values(toSaleRow(sale))
      .execute();
    return sale;
  }

  async update(databaseName: string, id: string, input: SaleSavePayload) {
    const db = await salesDatabase(databaseName);
    const existing = await db
      .selectFrom("billing_sales")
      .select("id")
      .where("id", "=", id)
      .executeTakeFirst();
    if (!existing) return null;
    const sale = createSaleRecord(input, { id });
    await db.updateTable("billing_sales").set(toSaleRow(sale)).where("id", "=", id).execute();
    return sale;
  }

  async setStatus(databaseName: string, id: string, status: Sale["status"]) {
    const db = await salesDatabase(databaseName);
    const existing = await db
      .selectFrom("billing_sales")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    if (!existing) return null;
    const updatedAt = new Date().toISOString();
    await db
      .updateTable("billing_sales")
      .set({ status, updated_at: updatedAt })
      .where("id", "=", id)
      .execute();
    return { ...toSale(existing), status, updatedAt };
  }

  async updateCompliance(
    databaseName: string,
    id: string,
    patch: { einvoice?: SaleEinvoiceDetails; eway?: SaleEwayDetails }
  ) {
    const db = await salesDatabase(databaseName);
    const values: Partial<SalesTableRow> = { updated_at: new Date().toISOString() };
    if (patch.einvoice) values.einvoice_json = JSON.stringify(patch.einvoice);
    if (patch.eway) values.eway_json = JSON.stringify(patch.eway);
    await db.updateTable("billing_sales").set(values).where("id", "=", id).execute();
    return this.get(databaseName, id);
  }
}

function salesDatabase(databaseName: string) {
  return getBillingDatabase(databaseName) as unknown as Promise<Kysely<SalesDatabase>>;
}

function toSale(row: SalesTableRow): Sale {
  const items = parseItems(row.items_json);
  return {
    amount: Number(row.amount),
    billingAddress: row.billing_address ?? "",
    createdAt: row.created_at ?? "",
    currencyCode: row.currency_code,
    customerEmail: row.customer_email ?? "",
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? "",
    einvoice: parseDocument(row.einvoice_json, defaultEinvoice),
    eway: parseDocument(row.eway_json, defaultEway),
    id: row.id,
    invoiceNumber: row.invoice_number,
    issuedOn: row.issued_on,
    items,
    notes: row.notes ?? "",
    roundOff: Number(row.round_off ?? 0),
    shippingAddress: row.shipping_address ?? "",
    salesLedger: row.sales_ledger ?? "",
    status: row.status,
    subtotal: Number(row.subtotal ?? items.reduce((sum, item) => sum + item.taxableAmount, 0)),
    taxAmount: Number(row.tax_amount ?? items.reduce((sum, item) => sum + item.taxAmount, 0)),
    taxType: row.tax_type ?? "cgst-sgst",
    terms: row.terms ?? "",
    updatedAt: row.updated_at ?? row.created_at ?? "",
    workOrderNo: row.work_order_no ?? ""
  };
}

function toSaleRow(sale: Sale): SalesTableRow {
  return {
    amount: sale.amount,
    billing_address: sale.billingAddress,
    created_at: sale.createdAt,
    currency_code: sale.currencyCode,
    customer_email: sale.customerEmail,
    customer_name: sale.customerName,
    customer_phone: sale.customerPhone,
    einvoice_json: JSON.stringify(sale.einvoice),
    eway_json: JSON.stringify(sale.eway),
    id: sale.id,
    invoice_number: sale.invoiceNumber,
    issued_on: sale.issuedOn,
    items_json: JSON.stringify(sale.items),
    notes: sale.notes,
    round_off: sale.roundOff,
    shipping_address: sale.shippingAddress,
    sales_ledger: sale.salesLedger,
    status: sale.status,
    subtotal: sale.subtotal,
    tax_amount: sale.taxAmount,
    tax_type: sale.taxType,
    terms: sale.terms,
    updated_at: sale.updatedAt,
    work_order_no: sale.workOrderNo
  };
}

function createSaleRecord(
  input: SaleSavePayload,
  current?: Partial<Pick<Sale, "createdAt" | "id">>
) {
  const now = new Date().toISOString();
  const totals = buildSaleTotals(input);
  return {
    amount: totals.amount,
    billingAddress: input.billingAddress,
    createdAt: current?.createdAt ?? now,
    currencyCode: input.currencyCode,
    customerEmail: input.customerEmail,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    einvoice: input.einvoice ?? defaultEinvoice(),
    eway: input.eway ?? defaultEway(),
    id: current?.id ?? `sale-${randomUUID().slice(0, 8)}`,
    invoiceNumber: input.invoiceNumber,
    issuedOn: input.issuedOn,
    items: totals.items,
    notes: input.notes,
    roundOff: Number(input.roundOff ?? 0),
    shippingAddress: input.shippingAddress,
    salesLedger: input.salesLedger ?? "",
    status: input.status,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    taxType: input.taxType ?? "cgst-sgst",
    terms: input.terms ?? "",
    updatedAt: now,
    workOrderNo: input.workOrderNo ?? ""
  } satisfies Sale;
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

function parseDocument<T>(value: string | null, fallback: () => T) {
  if (!value) return fallback();
  try {
    return { ...fallback(), ...(JSON.parse(value) as Partial<T>) };
  } catch {
    return fallback();
  }
}

function defaultEway(): SaleEwayDetails {
  return {
    billDate: "",
    billNo: "",
    notes: "",
    part: "Part B",
    status: "not-generated",
    transport: "",
    transportGst: "",
    vehicleNo: ""
  };
}

function defaultEinvoice(): SaleEinvoiceDetails {
  return { ackDate: "", ackNo: "", irn: "", signedQr: "", status: "not-generated" };
}

function buildSaleTotals(input: SaleSavePayload) {
  const items = input.items.map((item, index) => {
    const taxableAmount = roundMoney(item.quantity * item.rate);
    const taxAmount = roundMoney((taxableAmount * item.taxRate) / 100);
    const cgstAmount = input.taxType === "igst" ? 0 : roundMoney(taxAmount / 2);
    const sgstAmount = input.taxType === "igst" ? 0 : roundMoney(taxAmount / 2);
    const igstAmount = input.taxType === "igst" ? taxAmount : 0;
    return {
      ...item,
      cgstAmount,
      id: `item-${index + 1}`,
      igstAmount,
      lineTotal: roundMoney(taxableAmount + taxAmount),
      sgstAmount,
      taxableAmount,
      taxAmount
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
