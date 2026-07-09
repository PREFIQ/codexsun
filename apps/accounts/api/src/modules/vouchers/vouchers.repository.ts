import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getAccountsDatabase } from "../../database/accounts-database.js";
import { AccountsSettingsRepository } from "../settings/settings.repository.js";
import type { Voucher, VoucherLine, VoucherSavePayload, VoucherStatus } from "./vouchers.types.js";

export class VouchersRepository {
  constructor(private readonly settings = new AccountsSettingsRepository()) {}

  async list(databaseName: string, search = "") {
    const db = await getAccountsDatabase(databaseName);
    const term = `%${search.trim()}%`;
    const result = await sql<VoucherRow>`
      SELECT *
      FROM account_vouchers
      WHERE ${search.trim() ? sql`(voucher_no LIKE ${term} OR voucher_type LIKE ${term} OR source_document_no LIKE ${term} OR status LIKE ${term})` : sql`1 = 1`}
      ORDER BY voucher_date DESC, id DESC
    `.execute(db);
    const vouchers = result.rows.map((row) => mapVoucher(row, []));
    const lines = await this.linesFor(databaseName, vouchers.map((voucher) => voucher.id));
    return vouchers.map((voucher) => ({ ...voucher, lines: lines.filter((line) => line.voucherId === voucher.id).map(({ voucherId: _voucherId, ...line }) => line) }));
  }

  async get(databaseName: string, id: string) {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<VoucherRow>`SELECT * FROM account_vouchers WHERE uuid = ${id} OR voucher_no = ${id} LIMIT 1`.execute(db);
    const row = result.rows[0];
    if (!row) return null;
    const lines = await this.linesFor(databaseName, [row.uuid]);
    return mapVoucher(row, lines.map(({ voucherId: _voucherId, ...line }) => line));
  }

  async findActiveBySource(databaseName: string, sourceApp: string, sourceModule: string, sourceDocumentId: string) {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<VoucherRow>`
      SELECT *
      FROM account_vouchers
      WHERE source_app = ${sourceApp}
        AND source_module = ${sourceModule}
        AND source_document_id = ${sourceDocumentId}
        AND status = 'posted'
      ORDER BY posting_version DESC, id DESC
      LIMIT 1
    `.execute(db);
    return result.rows[0] ? mapVoucher(result.rows[0], []) : null;
  }

  async isPeriodLocked(databaseName: string, voucherDate: string) {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<{ lock_count: number | string }>`
      SELECT COUNT(*) AS lock_count
      FROM account_period_locks
      WHERE status = 'active'
        AND ${voucherDate} BETWEEN from_date AND to_date
    `.execute(db);
    return Number(result.rows[0]?.lock_count ?? 0) > 0;
  }

  async create(databaseName: string, payload: VoucherSavePayload, totals: { credit: number; debit: number }) {
    const db = await getAccountsDatabase(databaseName);
    const uuid = randomBytes(4).toString("hex");
    const voucherNo = payload.voucherNo?.trim() || await this.nextVoucherNo(databaseName, payload.voucherType);
    await sql`
      INSERT INTO account_vouchers (
        uuid, voucher_no, voucher_date, voucher_type, status, narration, source_app, source_module,
        source_document_id, source_document_no, source_operation, total_debit, total_credit, tally_sync_status
      )
      VALUES (
        ${uuid}, ${voucherNo}, ${payload.voucherDate}, ${payload.voucherType}, ${payload.status ?? "posted"},
        ${payload.narration ?? null}, ${payload.sourceApp ?? null}, ${payload.sourceModule ?? null},
        ${payload.sourceDocumentId ?? null}, ${payload.sourceDocumentNo ?? null}, ${payload.sourceOperation ?? null},
        ${totals.debit}, ${totals.credit}, 'pending'
      )
    `.execute(db);
    const voucherId = await this.internalVoucherId(databaseName, uuid);
    await this.insertLines(databaseName, voucherId, payload.lines, payload.status ?? "posted");
    return this.get(databaseName, uuid);
  }

  async markStatus(databaseName: string, id: string, status: VoucherStatus) {
    const db = await getAccountsDatabase(databaseName);
    const lineStatus = status === "posted" ? "posted" : "cancelled";
    await sql`UPDATE account_vouchers SET status = ${status}, updated_at = CURRENT_TIMESTAMP WHERE uuid = ${id} OR voucher_no = ${id}`.execute(db);
    const voucherId = await this.internalVoucherId(databaseName, id);
    await sql`UPDATE account_voucher_lines SET status = ${lineStatus} WHERE voucher_id = ${voucherId}`.execute(db);
    return this.get(databaseName, id);
  }

  private async insertLines(databaseName: string, voucherId: number, lines: VoucherSavePayload["lines"], status: VoucherStatus) {
    const db = await getAccountsDatabase(databaseName);
    const lineStatus = status === "posted" ? "posted" : "cancelled";
    for (const [index, line] of lines.entries()) {
      const ledgerId = await this.internalLedgerId(databaseName, line.ledgerId);
      await sql`
        INSERT INTO account_voucher_lines (uuid, voucher_id, ledger_id, dc, amount, narration, sort_order, status)
        VALUES (${randomBytes(4).toString("hex")}, ${voucherId}, ${ledgerId}, ${line.dc}, ${Number(line.amount)}, ${line.narration ?? null}, ${index + 1}, ${lineStatus})
      `.execute(db);
    }
  }

  private async linesFor(databaseName: string, voucherUuids: string[]) {
    if (!voucherUuids.length) return [];
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<LineRow>`
      SELECT vl.*, v.uuid AS voucher_uuid, l.uuid AS ledger_uuid, l.code AS ledger_code, l.name AS ledger_name
      FROM account_voucher_lines vl
      JOIN account_vouchers v ON v.id = vl.voucher_id
      JOIN account_ledgers l ON l.id = vl.ledger_id
      WHERE v.uuid IN (${sql.join(voucherUuids)})
      ORDER BY vl.sort_order
    `.execute(db);
    return result.rows.map(mapLineWithVoucher);
  }

  private async internalVoucherId(databaseName: string, id: string) {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<{ id: number }>`SELECT id FROM account_vouchers WHERE uuid = ${id} OR voucher_no = ${id} LIMIT 1`.execute(db);
    const value = result.rows[0]?.id;
    if (!value) throw new Error(`Voucher not found: ${id}`);
    return value;
  }

  private async internalLedgerId(databaseName: string, id: string) {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<{ id: number }>`SELECT id FROM account_ledgers WHERE uuid = ${id} OR code = ${id} LIMIT 1`.execute(db);
    const value = result.rows[0]?.id;
    if (!value) throw new Error(`Ledger not found: ${id}`);
    return value;
  }

  private async nextVoucherNo(databaseName: string, type: string) {
    const db = await getAccountsDatabase(databaseName);
    const settings = await this.settings.get(databaseName);
    const prefix = prefixForVoucherType(type, settings.voucherNumbering);
    const result = await sql<{ count_value: number | string }>`SELECT COUNT(*) + 1 AS count_value FROM account_vouchers WHERE voucher_type = ${type}`.execute(db);
    return `${prefix}-${String(Number(result.rows[0]?.count_value ?? 1)).padStart(5, "0")}`;
  }
}

function prefixForVoucherType(type: string, numbering: Awaited<ReturnType<AccountsSettingsRepository["get"]>>["voucherNumbering"]) {
  if (type === "sales") return numbering.salesPrefix;
  if (type === "receipt") return numbering.receiptPrefix;
  if (type === "payment") return numbering.paymentPrefix;
  if (type === "journal") return numbering.journalPrefix;
  if (type === "debit_note") return numbering.debitNotePrefix;
  if (type === "credit_note") return numbering.creditNotePrefix;
  return type.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
}

type VoucherRow = {
  created_at: string | Date;
  narration: string | null;
  source_app: string | null;
  source_document_id: string | null;
  source_document_no: string | null;
  source_module: string | null;
  source_operation: Voucher["sourceOperation"];
  status: Voucher["status"];
  tally_error: string | null;
  tally_external_id: string | null;
  tally_sync_status: Voucher["tallySyncStatus"];
  total_credit: number | string;
  total_debit: number | string;
  updated_at: string | Date;
  uuid: string;
  voucher_date: string | Date;
  voucher_no: string;
  voucher_type: Voucher["voucherType"];
};

type LineRow = {
  amount: number | string;
  dc: VoucherLine["dc"];
  ledger_code: string;
  ledger_name: string;
  ledger_uuid: string;
  narration: string | null;
  sort_order: number;
  uuid: string;
  voucher_uuid: string;
};

function mapVoucher(row: VoucherRow, lines: VoucherLine[]): Voucher {
  return {
    createdAt: dateText(row.created_at),
    id: row.uuid,
    lines,
    narration: row.narration,
    sourceApp: row.source_app,
    sourceDocumentId: row.source_document_id,
    sourceDocumentNo: row.source_document_no,
    sourceModule: row.source_module,
    sourceOperation: row.source_operation,
    status: row.status,
    tallyError: row.tally_error,
    tallyExternalId: row.tally_external_id,
    tallySyncStatus: row.tally_sync_status,
    totalCredit: Number(row.total_credit ?? 0),
    totalDebit: Number(row.total_debit ?? 0),
    updatedAt: dateText(row.updated_at),
    voucherDate: dateText(row.voucher_date).slice(0, 10),
    voucherNo: row.voucher_no,
    voucherType: row.voucher_type
  };
}

function mapLineWithVoucher(row: LineRow): VoucherLine & { voucherId: string } {
  return {
    amount: Number(row.amount ?? 0),
    dc: row.dc,
    id: row.uuid,
    ledgerCode: row.ledger_code,
    ledgerId: row.ledger_uuid,
    ledgerName: row.ledger_name,
    narration: row.narration,
    sortOrder: Number(row.sort_order ?? 0),
    voucherId: row.voucher_uuid
  };
}

function dateText(value: string | Date) {
  return value instanceof Date ? value.toISOString() : String(value);
}
