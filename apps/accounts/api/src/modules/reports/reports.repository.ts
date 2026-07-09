import { sql } from "kysely";
import { getAccountsDatabase } from "../../database/accounts-database.js";
import type { BalanceSheetRow, GstSummaryRow, LedgerStatementRow, OutstandingRow, ProfitAndLossRow, TrialBalanceRow, VoucherRegisterRow } from "./reports.types.js";

export class ReportsRepository {
  async trialBalance(databaseName: string): Promise<TrialBalanceRow[]> {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<TrialRow>`
      SELECT l.uuid AS ledger_id, l.code AS ledger_code, l.name AS ledger_name, g.name AS group_name,
             l.current_debit AS debit, l.current_credit AS credit, l.closing_balance AS closing_balance
      FROM account_ledgers l
      JOIN account_groups g ON g.id = l.group_id
      ORDER BY g.name, l.name
    `.execute(db);
    return result.rows.map((row) => ({
      closingBalance: Number(row.closing_balance ?? 0),
      credit: Number(row.credit ?? 0),
      debit: Number(row.debit ?? 0),
      groupName: row.group_name,
      ledgerCode: row.ledger_code,
      ledgerId: row.ledger_id,
      ledgerName: row.ledger_name
    }));
  }

  async ledgerStatement(databaseName: string, ledgerId: string): Promise<LedgerStatementRow[]> {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<StatementRow>`
      SELECT v.voucher_date, v.voucher_no, v.voucher_type, l.code AS ledger_code, l.name AS ledger_name,
             vl.dc, vl.amount, vl.narration
      FROM account_voucher_lines vl
      JOIN account_vouchers v ON v.id = vl.voucher_id
      JOIN account_ledgers l ON l.id = vl.ledger_id
      WHERE (l.uuid = ${ledgerId} OR l.code = ${ledgerId}) AND vl.status = 'posted'
      ORDER BY v.voucher_date, v.id, vl.sort_order
    `.execute(db);
    let balance = 0;
    return result.rows.map((row) => {
      const amount = Number(row.amount ?? 0);
      balance += row.dc === "debit" ? amount : -amount;
      return {
        amount,
        balance: round(balance),
        dc: row.dc,
        ledgerCode: row.ledger_code,
        ledgerName: row.ledger_name,
        narration: row.narration,
        voucherDate: dateText(row.voucher_date).slice(0, 10),
        voucherNo: row.voucher_no,
        voucherType: row.voucher_type
      };
    });
  }

  async outstanding(databaseName: string): Promise<OutstandingRow[]> {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<OutstandingSqlRow>`
      SELECT uuid AS ledger_id, code AS ledger_code, name AS ledger_name, classification, closing_balance AS balance
      FROM account_ledgers
      WHERE classification IN ('customer', 'supplier') AND ABS(closing_balance) > 0.009
      ORDER BY classification, name
    `.execute(db);
    return result.rows.map((row) => ({
      balance: Number(row.balance ?? 0),
      classification: row.classification,
      ledgerCode: row.ledger_code,
      ledgerId: row.ledger_id,
      ledgerName: row.ledger_name
    }));
  }

  async voucherRegister(databaseName: string): Promise<VoucherRegisterRow[]> {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<VoucherRegisterSqlRow>`
      SELECT voucher_date, voucher_no, voucher_type, source_document_no, status, tally_sync_status, total_debit, total_credit
      FROM account_vouchers
      ORDER BY voucher_date DESC, id DESC
    `.execute(db);
    return result.rows.map((row) => ({
      sourceDocumentNo: row.source_document_no,
      status: row.status,
      tallySyncStatus: row.tally_sync_status,
      totalCredit: Number(row.total_credit ?? 0),
      totalDebit: Number(row.total_debit ?? 0),
      voucherDate: dateText(row.voucher_date).slice(0, 10),
      voucherNo: row.voucher_no,
      voucherType: row.voucher_type
    }));
  }

  async gstSummary(databaseName: string): Promise<GstSummaryRow[]> {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<GstSqlRow>`
      SELECT l.code AS ledger_code, l.name AS ledger_name,
             SUM(CASE WHEN vl.dc = 'debit' THEN vl.amount ELSE 0 END) AS debit,
             SUM(CASE WHEN vl.dc = 'credit' THEN vl.amount ELSE 0 END) AS credit
      FROM account_ledgers l
      LEFT JOIN account_voucher_lines vl ON vl.ledger_id = l.id AND vl.status = 'posted'
      WHERE l.classification IN ('gst_input', 'gst_output')
      GROUP BY l.code, l.name
      ORDER BY l.code
    `.execute(db);
    return result.rows.map((row) => {
      const debit = Number(row.debit ?? 0);
      const credit = Number(row.credit ?? 0);
      return { credit, debit, ledgerCode: row.ledger_code, ledgerName: row.ledger_name, net: round(credit - debit) };
    });
  }

  async profitAndLoss(databaseName: string): Promise<ProfitAndLossRow[]> {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<NatureSqlRow>`
      SELECT g.name AS group_name, g.nature, SUM(l.current_credit - l.current_debit) AS amount
      FROM account_ledgers l
      JOIN account_groups g ON g.id = l.group_id
      WHERE g.nature IN ('income', 'expense')
      GROUP BY g.name, g.nature
      ORDER BY g.nature, g.name
    `.execute(db);
    return result.rows.map((row) => ({ amount: Number(row.amount ?? 0), groupName: row.group_name, nature: row.nature as "income" | "expense" }));
  }

  async balanceSheet(databaseName: string): Promise<BalanceSheetRow[]> {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<NatureSqlRow>`
      SELECT g.name AS group_name, g.nature, SUM(l.closing_balance) AS amount
      FROM account_ledgers l
      JOIN account_groups g ON g.id = l.group_id
      WHERE g.nature IN ('asset', 'liability', 'capital')
      GROUP BY g.name, g.nature
      ORDER BY g.nature, g.name
    `.execute(db);
    return result.rows.map((row) => ({ amount: Number(row.amount ?? 0), groupName: row.group_name, nature: row.nature as "asset" | "capital" | "liability" }));
  }
}

type TrialRow = { closing_balance: number | string; credit: number | string; debit: number | string; group_name: string; ledger_code: string; ledger_id: string; ledger_name: string };
type StatementRow = { amount: number | string; dc: "debit" | "credit"; ledger_code: string; ledger_name: string; narration: string | null; voucher_date: string | Date; voucher_no: string; voucher_type: string };
type OutstandingSqlRow = { balance: number | string; classification: "customer" | "supplier"; ledger_code: string; ledger_id: string; ledger_name: string };
type VoucherRegisterSqlRow = { source_document_no: string | null; status: string; tally_sync_status: string; total_credit: number | string; total_debit: number | string; voucher_date: string | Date; voucher_no: string; voucher_type: string };
type GstSqlRow = { credit: number | string; debit: number | string; ledger_code: string; ledger_name: string };
type NatureSqlRow = { amount: number | string; group_name: string; nature: string };

function dateText(value: string | Date) {
  return value instanceof Date ? value.toISOString() : String(value);
}

function round(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
