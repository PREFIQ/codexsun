import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type {
  HsnCodesListFilters,
  HsnCodesRecord,
  HsnCodesSavePayload
} from "./hsn-codes.types.js";

type HsnCodesRow = {
  id: string;
  uuid: string;
  code: string;
  description: string;
  is_active: number | boolean;
  sort_order: number;
};

export class HsnCodesRepository {
  async list(filters: HsnCodesListFilters = {}) {
    const rows =
      await sql<HsnCodesRow>`SELECT id, uuid, code, description, is_active, sort_order FROM hsn_codes
      WHERE (${filters.search ?? ""} = '' OR LOWER(code) LIKE ${like(filters.search)} OR LOWER(description) LIKE ${like(filters.search)})
      ORDER BY sort_order, id`.execute(getCoreDatabase());
    return rows.rows.map(toHsnCodes);
  }

  async find(id: string) {
    const rows =
      await sql<HsnCodesRow>`SELECT id, uuid, code, description, is_active, sort_order FROM hsn_codes
      WHERE id=${id} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toHsnCodes(rows.rows[0]) : null;
  }

  async create(input: HsnCodesSavePayload) {
    const id = `hsnCodes-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    await sql`INSERT INTO hsn_codes (id, uuid, code, description, is_active, sort_order) VALUES
      (${id}, ${uuid}, ${normalizeString(input.code)}, ${normalizeString(input.description)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})`.execute(
      getCoreDatabase()
    );
    return (await this.find(id))!;
  }

  async update(id: string, input: HsnCodesSavePayload) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE hsn_codes SET code=${normalizeString(input.code)}, description=${normalizeString(input.description)}, is_active=${input.isActive === false ? 0 : 1},
      sort_order=${numberValue(input.sortOrder, 1000)}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE hsn_codes SET is_active=${isActive ? 1 : 0}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`DELETE FROM hsn_codes WHERE id=${id}`.execute(getCoreDatabase());
    return existing;
  }
}

function canMutate(record: HsnCodesRecord) {
  if (String(record.code ?? "").trim() === "-" || String(record.description ?? "").trim() === "-")
    return false;
  return true;
}

function toHsnCodes(row: HsnCodesRow): HsnCodesRecord {
  return {
    id: row.id,
    uuid: row.uuid,
    code: row.code,
    description: row.description,
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
