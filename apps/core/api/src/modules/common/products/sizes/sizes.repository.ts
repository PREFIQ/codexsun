import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type { SizesListFilters, SizesRecord, SizesSavePayload } from "./sizes.types.js";

type SizesRow = {
  id: string;
  uuid: string;
  name: string;
  is_active: number | boolean;
  sort_order: number;
};

export class SizesRepository {
  async list(filters: SizesListFilters = {}) {
    const rows = await sql<SizesRow>`SELECT id, uuid, name, is_active, sort_order FROM sizes
      WHERE (${filters.search ?? ""} = '' OR LOWER(name) LIKE ${like(filters.search)})
      ORDER BY sort_order, id`.execute(getCoreDatabase());
    return rows.rows.map(toSizes);
  }

  async find(id: string) {
    const rows = await sql<SizesRow>`SELECT id, uuid, name, is_active, sort_order FROM sizes
      WHERE id=${id} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toSizes(rows.rows[0]) : null;
  }

  async create(input: SizesSavePayload) {
    const id = `sizes-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    await sql`INSERT INTO sizes (id, uuid, name, is_active, sort_order) VALUES
      (${id}, ${uuid}, ${normalizeString(input.name)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})`.execute(
      getCoreDatabase()
    );
    return (await this.find(id))!;
  }

  async update(id: string, input: SizesSavePayload) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE sizes SET name=${normalizeString(input.name)}, is_active=${input.isActive === false ? 0 : 1},
      sort_order=${numberValue(input.sortOrder, 1000)}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE sizes SET is_active=${isActive ? 1 : 0}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`DELETE FROM sizes WHERE id=${id}`.execute(getCoreDatabase());
    return existing;
  }
}

function canMutate(record: SizesRecord) {
  if (String(record.name ?? "").trim() === "-") return false;
  return true;
}

function toSizes(row: SizesRow): SizesRecord {
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
