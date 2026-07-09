import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import type { AccountGroupNature, LedgerClassification } from "./ledgers.types.js";

const groups: Array<{ code: string; name: string; nature: AccountGroupNature; parentCode?: string }> = [
  { code: "ASSET", name: "Assets", nature: "asset" },
  { code: "LIABILITY", name: "Liabilities", nature: "liability" },
  { code: "INCOME", name: "Income", nature: "income" },
  { code: "EXPENSE", name: "Expenses", nature: "expense" },
  { code: "CAPITAL", name: "Capital", nature: "capital" },
  { code: "SUNDRY_DEBTORS", name: "Sundry Debtors", nature: "asset", parentCode: "ASSET" },
  { code: "SUNDRY_CREDITORS", name: "Sundry Creditors", nature: "liability", parentCode: "LIABILITY" },
  { code: "SALES_ACCOUNTS", name: "Sales Accounts", nature: "income", parentCode: "INCOME" },
  { code: "PURCHASE_ACCOUNTS", name: "Purchase Accounts", nature: "expense", parentCode: "EXPENSE" },
  { code: "DUTIES_TAXES", name: "Duties & Taxes", nature: "liability", parentCode: "LIABILITY" },
  { code: "CASH_IN_HAND", name: "Cash-in-Hand", nature: "asset", parentCode: "ASSET" },
  { code: "BANK_ACCOUNTS", name: "Bank Accounts", nature: "asset", parentCode: "ASSET" },
  { code: "ROUND_OFF", name: "Round Off", nature: "expense", parentCode: "EXPENSE" },
  { code: "DISCOUNTS", name: "Discounts", nature: "expense", parentCode: "EXPENSE" }
];

const ledgers: Array<{ classification: LedgerClassification; code: string; groupCode: string; name: string }> = [
  { classification: "cash", code: "CASH", groupCode: "CASH_IN_HAND", name: "Cash" },
  { classification: "bank", code: "BANK", groupCode: "BANK_ACCOUNTS", name: "Bank" },
  { classification: "sales", code: "SALES", groupCode: "SALES_ACCOUNTS", name: "Sales" },
  { classification: "purchase", code: "PURCHASE", groupCode: "PURCHASE_ACCOUNTS", name: "Purchase" },
  { classification: "gst_output", code: "OUTPUT_CGST", groupCode: "DUTIES_TAXES", name: "Output CGST" },
  { classification: "gst_output", code: "OUTPUT_SGST", groupCode: "DUTIES_TAXES", name: "Output SGST" },
  { classification: "gst_output", code: "OUTPUT_IGST", groupCode: "DUTIES_TAXES", name: "Output IGST" },
  { classification: "gst_input", code: "INPUT_CGST", groupCode: "DUTIES_TAXES", name: "Input CGST" },
  { classification: "gst_input", code: "INPUT_SGST", groupCode: "DUTIES_TAXES", name: "Input SGST" },
  { classification: "gst_input", code: "INPUT_IGST", groupCode: "DUTIES_TAXES", name: "Input IGST" },
  { classification: "round_off", code: "ROUND_OFF", groupCode: "ROUND_OFF", name: "Round Off" },
  { classification: "discount", code: "DISCOUNT", groupCode: "DISCOUNTS", name: "Discount" }
];

export async function seedLedgersModule(db: Kysely<any>) {
  for (const group of groups) {
    const parentId = group.parentCode ? await groupIdByCode(db, group.parentCode) : null;
    await sql`
      INSERT INTO account_groups (uuid, code, name, nature, parent_id, is_system, status)
      VALUES (${stableUuid(`group:${group.code}`)}, ${group.code}, ${group.name}, ${group.nature}, ${parentId}, true, 'active')
      ON DUPLICATE KEY UPDATE name = VALUES(name), nature = VALUES(nature), parent_id = VALUES(parent_id), is_system = true, status = 'active'
    `.execute(db);
  }

  for (const ledger of ledgers) {
    const groupId = await groupIdByCode(db, ledger.groupCode);
    await sql`
      INSERT INTO account_ledgers (uuid, code, name, group_id, classification, opening_balance, current_debit, current_credit, closing_balance, tally_ledger_name, is_system, status)
      VALUES (${stableUuid(`ledger:${ledger.code}`)}, ${ledger.code}, ${ledger.name}, ${groupId}, ${ledger.classification}, 0, 0, 0, 0, ${ledger.name}, true, 'active')
      ON DUPLICATE KEY UPDATE name = VALUES(name), group_id = VALUES(group_id), classification = VALUES(classification), tally_ledger_name = VALUES(tally_ledger_name), is_system = true, status = 'active'
    `.execute(db);
  }
}

async function groupIdByCode(db: Kysely<any>, code: string) {
  const result = await sql<{ id: number }>`SELECT id FROM account_groups WHERE code = ${code} LIMIT 1`.execute(db);
  const id = result.rows[0]?.id;
  if (!id) throw new Error(`Account group not found: ${code}`);
  return id;
}

function stableUuid(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 8);
}
