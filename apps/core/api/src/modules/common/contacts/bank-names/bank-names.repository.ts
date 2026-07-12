import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type {
  BankNamesListFilters,
  BankNamesRecord,
  BankNamesSavePayload
} from "./bank-names.types.js";

type BankNamesRow = {
  id: string;
  uuid: string;
  name: string;
  is_active: number | boolean;
  sort_order: number;
};

export class BankNamesRepository {
  async list(filters: BankNamesListFilters = {}) {
    const rows =
      await sql<BankNamesRow>`SELECT id, uuid, name, is_active, sort_order FROM bank_names
      WHERE (${filters.search ?? ""} = '' OR LOWER(name) LIKE ${like(filters.search)})
      ORDER BY sort_order, id`.execute(getCoreDatabase());
    return rows.rows.map(toBankNames);
  }

  async find(id: string) {
    const rows =
      await sql<BankNamesRow>`SELECT id, uuid, name, is_active, sort_order FROM bank_names
      WHERE id=${id} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toBankNames(rows.rows[0]) : null;
  }

  async create(input: BankNamesSavePayload) {
    const id = `bankNames-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    await sql`INSERT INTO bank_names (id, uuid, name, is_active, sort_order) VALUES
      (${id}, ${uuid}, ${normalizeString(input.name)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})`.execute(
      getCoreDatabase()
    );
    return (await this.find(id))!;
  }

  async update(id: string, input: BankNamesSavePayload) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE bank_names SET name=${normalizeString(input.name)}, is_active=${input.isActive === false ? 0 : 1},
      sort_order=${numberValue(input.sortOrder, 1000)}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE bank_names SET is_active=${isActive ? 1 : 0}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`DELETE FROM bank_names WHERE id=${id}`.execute(getCoreDatabase());
    return existing;
  }
}

function canMutate(record: BankNamesRecord) {
  if (String(record.name ?? "").trim() === "-") return false;
  return true;
}

function toBankNames(row: BankNamesRow): BankNamesRecord {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    isActive: Boolean(row.is_active),
    sortOrder: Number(row.sort_order)
  };
}

function like(value?: string) {
  return `%${(value ?? "").trim().toLowerCase()}%`;
}
function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}
