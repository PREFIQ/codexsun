import { randomBytes } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { getAccountsDatabase } from "../../database/accounts-database.js";
import type { AccountGroup, Ledger, LedgerLookup, LedgerSavePayload } from "./ledgers.types.js";

export class LedgersRepository {
  async groups(databaseName: string) {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<GroupRow>`SELECT * FROM account_groups ORDER BY nature, name`.execute(db);
    return result.rows.map(mapGroup);
  }

  async list(databaseName: string, search = "") {
    const db = await getAccountsDatabase(databaseName);
    const term = `%${search.trim()}%`;
    const result = await sql<LedgerRow>`
      SELECT l.*, g.name AS group_name, g.code AS group_code
      FROM account_ledgers l
      JOIN account_groups g ON g.id = l.group_id
      WHERE ${search.trim() ? sql`(l.name LIKE ${term} OR l.code LIKE ${term} OR l.classification LIKE ${term} OR g.name LIKE ${term})` : sql`1 = 1`}
      ORDER BY l.name
    `.execute(db);
    return result.rows.map(mapLedger);
  }

  async lookup(databaseName: string): Promise<LedgerLookup[]> {
    return (await this.list(databaseName)).filter((ledger) => ledger.status === "active").map(({ classification, code, groupName, id, name, status }) => ({ classification, code, groupName, id, name, status }));
  }

  async get(databaseName: string, id: string) {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<LedgerRow>`
      SELECT l.*, g.name AS group_name, g.code AS group_code
      FROM account_ledgers l
      JOIN account_groups g ON g.id = l.group_id
      WHERE l.uuid = ${id} OR l.code = ${id}
      LIMIT 1
    `.execute(db);
    return result.rows[0] ? mapLedger(result.rows[0]) : null;
  }

  async findByCode(databaseName: string, code: string) {
    return this.get(databaseName, code);
  }

  async create(databaseName: string, payload: LedgerSavePayload) {
    const db = await getAccountsDatabase(databaseName);
    const uuid = randomBytes(4).toString("hex");
    await sql`
      INSERT INTO account_ledgers (uuid, code, name, group_id, classification, opening_balance, current_debit, current_credit, closing_balance, tally_ledger_name, is_system, status)
      VALUES (${uuid}, ${payload.code}, ${payload.name}, ${Number(payload.groupId)}, ${payload.classification}, ${Number(payload.openingBalance ?? 0)}, 0, 0, ${Number(payload.openingBalance ?? 0)}, ${payload.tallyLedgerName ?? payload.name}, false, ${payload.status})
    `.execute(db);
    return this.get(databaseName, uuid);
  }

  async update(databaseName: string, id: string, payload: LedgerSavePayload) {
    const db = await getAccountsDatabase(databaseName);
    await sql`
      UPDATE account_ledgers
      SET code = ${payload.code},
          name = ${payload.name},
          group_id = ${Number(payload.groupId)},
          classification = ${payload.classification},
          opening_balance = ${Number(payload.openingBalance ?? 0)},
          tally_ledger_name = ${payload.tallyLedgerName ?? payload.name},
          status = ${payload.status},
          updated_at = CURRENT_TIMESTAMP
      WHERE uuid = ${id} OR code = ${id}
    `.execute(db);
    await this.recalculateAll(databaseName);
    return this.get(databaseName, id);
  }

  async recalculateAll(databaseName: string) {
    const db = await getAccountsDatabase(databaseName);
    await sql`
      UPDATE account_ledgers l
      LEFT JOIN (
        SELECT ledger_id,
               SUM(CASE WHEN dc = 'debit' THEN amount ELSE 0 END) AS debit_total,
               SUM(CASE WHEN dc = 'credit' THEN amount ELSE 0 END) AS credit_total
        FROM account_voucher_lines
        WHERE status = 'posted'
        GROUP BY ledger_id
      ) totals ON totals.ledger_id = l.id
      SET l.current_debit = COALESCE(totals.debit_total, 0),
          l.current_credit = COALESCE(totals.credit_total, 0),
          l.closing_balance = l.opening_balance + COALESCE(totals.debit_total, 0) - COALESCE(totals.credit_total, 0),
          l.updated_at = CURRENT_TIMESTAMP
    `.execute(db as Kysely<unknown>);
  }
}

type GroupRow = {
  code: string;
  id: number;
  is_system: number | boolean;
  name: string;
  nature: AccountGroup["nature"];
  parent_id: number | null;
  status: AccountGroup["status"];
  uuid: string;
};

type LedgerRow = {
  classification: Ledger["classification"];
  closing_balance: number | string;
  code: string;
  current_credit: number | string;
  current_debit: number | string;
  group_code: string;
  group_id: number;
  group_name: string;
  id: number;
  is_system: number | boolean;
  name: string;
  opening_balance: number | string;
  status: Ledger["status"];
  tally_ledger_name: string | null;
  uuid: string;
};

function mapGroup(row: GroupRow): AccountGroup {
  return {
    code: row.code,
    id: String(row.id),
    isSystem: Boolean(row.is_system),
    name: row.name,
    nature: row.nature,
    parentId: row.parent_id ? String(row.parent_id) : null,
    status: row.status,
    uuid: row.uuid
  };
}

function mapLedger(row: LedgerRow): Ledger {
  return {
    classification: row.classification,
    closingBalance: Number(row.closing_balance ?? 0),
    code: row.code,
    currentCredit: Number(row.current_credit ?? 0),
    currentDebit: Number(row.current_debit ?? 0),
    groupCode: row.group_code,
    groupId: String(row.group_id),
    groupName: row.group_name,
    id: row.uuid,
    isSystem: Boolean(row.is_system),
    name: row.name,
    openingBalance: Number(row.opening_balance ?? 0),
    status: row.status,
    tallyLedgerName: row.tally_ledger_name,
    uuid: row.uuid
  };
}
