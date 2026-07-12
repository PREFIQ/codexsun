import { randomUUID } from "node:crypto";
import { getBillingDatabase } from "../../database/billing-database.js";
import type { Receipt, ReceiptInput, ReceiptStatus } from "./receipt.types.js";
export class ReceiptRepository {
  async list(databaseName: string) {
    const db = (await getBillingDatabase(databaseName)) as any;
    return (
      await db
        .selectFrom("billing_receipts")
        .selectAll()
        .orderBy("receipt_date", "desc")
        .orderBy("receipt_number", "desc")
        .execute()
    ).map(toReceipt);
  }
  async get(databaseName: string, id: string) {
    const db = (await getBillingDatabase(databaseName)) as any;
    const row = await db
      .selectFrom("billing_receipts")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toReceipt(row) : null;
  }
  async findByNumber(databaseName: string, number: string) {
    const db = (await getBillingDatabase(databaseName)) as any;
    const row = await db
      .selectFrom("billing_receipts")
      .selectAll()
      .where("receipt_number", "=", number)
      .executeTakeFirst();
    return row ? toReceipt(row) : null;
  }
  async create(databaseName: string, input: ReceiptInput) {
    const record = makeReceipt(input);
    const db = (await getBillingDatabase(databaseName)) as any;
    await db.insertInto("billing_receipts").values(toRow(record)).execute();
    return record;
  }
  async update(databaseName: string, id: string, input: ReceiptInput) {
    const db = (await getBillingDatabase(databaseName)) as any;
    const current = await db
      .selectFrom("billing_receipts")
      .select(["created_at"])
      .where("id", "=", id)
      .executeTakeFirst();
    if (!current) return null;
    const record = makeReceipt(input, id, current.created_at);
    await db.updateTable("billing_receipts").set(toRow(record)).where("id", "=", id).execute();
    return record;
  }
  async setStatus(databaseName: string, id: string, status: ReceiptStatus) {
    const db = (await getBillingDatabase(databaseName)) as any;
    await db
      .updateTable("billing_receipts")
      .set({ status, updated_at: new Date().toISOString() })
      .where("id", "=", id)
      .execute();
    return this.get(databaseName, id);
  }
  async delete(databaseName: string, id: string) {
    const record = await this.get(databaseName, id);
    if (!record) return null;
    const db = (await getBillingDatabase(databaseName)) as any;
    await db.deleteFrom("billing_receipts").where("id", "=", id).execute();
    return record;
  }
}
function makeReceipt(
  input: ReceiptInput,
  id = `receipt-${randomUUID().slice(0, 8)}`,
  createdAt = new Date().toISOString()
): Receipt {
  const allocations = input.allocations ?? [];
  const allocatedAmount = round(
    allocations.reduce((sum, item) => sum + Number(item.allocatedAmount || 0), 0)
  );
  const amount = Number(input.amount || 0);
  const totalAmount = round(
    amount +
      Number(input.tdsAmount || 0) -
      Number(input.discountAmount || 0) +
      Number(input.roundOff || 0)
  );
  return {
    id,
    receiptNumber: String(input.receiptNumber ?? ""),
    receiptDate: input.receiptDate,
    partyName: input.partyName.trim(),
    partyId: String(input.partyId ?? ""),
    partyType: String(input.partyType ?? "customer"),
    receiptMode: String(input.receiptMode ?? "cash"),
    bankAccount: String(input.bankAccount ?? ""),
    referenceNo: String(input.referenceNo ?? ""),
    referenceDate: String(input.referenceDate ?? ""),
    amount,
    tdsAmount: Number(input.tdsAmount || 0),
    discountAmount: Number(input.discountAmount || 0),
    roundOff: Number(input.roundOff || 0),
    totalAmount,
    allocatedAmount,
    unallocatedAmount: round(totalAmount - allocatedAmount),
    status: (input.status ?? "draft") as ReceiptStatus,
    notes: String(input.notes ?? ""),
    allocations,
    createdAt,
    updatedAt: new Date().toISOString()
  };
}
function toReceipt(row: any): Receipt {
  return {
    id: row.id,
    receiptNumber: row.receipt_number,
    receiptDate: row.receipt_date,
    partyName: row.party_name,
    partyId: row.party_id ?? "",
    partyType: row.party_type,
    receiptMode: row.receipt_mode,
    bankAccount: row.bank_account ?? "",
    referenceNo: row.reference_no ?? "",
    referenceDate: row.reference_date ?? "",
    amount: Number(row.amount),
    tdsAmount: Number(row.tds_amount),
    discountAmount: Number(row.discount_amount),
    roundOff: Number(row.round_off),
    totalAmount: Number(row.total_amount),
    allocatedAmount: Number(row.allocated_amount),
    unallocatedAmount: Number(row.unallocated_amount),
    status: row.status,
    notes: row.notes ?? "",
    allocations: parse(row.allocations_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function toRow(record: Receipt) {
  return {
    id: record.id,
    receipt_number: record.receiptNumber,
    receipt_date: record.receiptDate,
    party_name: record.partyName,
    party_id: record.partyId || null,
    party_type: record.partyType,
    receipt_mode: record.receiptMode,
    bank_account: record.bankAccount || null,
    reference_no: record.referenceNo || null,
    reference_date: record.referenceDate || null,
    amount: record.amount,
    tds_amount: record.tdsAmount,
    discount_amount: record.discountAmount,
    round_off: record.roundOff,
    total_amount: record.totalAmount,
    allocated_amount: record.allocatedAmount,
    unallocated_amount: record.unallocatedAmount,
    status: record.status,
    notes: record.notes,
    allocations_json: JSON.stringify(record.allocations),
    created_at: record.createdAt,
    updated_at: record.updatedAt
  };
}
function parse(value: string | null) {
  try {
    const result = JSON.parse(value ?? "[]");
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}
function round(value: number) {
  return Math.round(value * 100) / 100;
}
