import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type {
  SalesTypesListFilters,
  SalesTypesRecord,
  SalesTypesSavePayload
} from "./sales-types.types.js";

type SalesTypesRow = {
  id: string;
  uuid: string;
  name: string;
  description: string | null;
  is_active: number | boolean;
  sort_order: number;
};

export class SalesTypesRepository {
  async list(filters: SalesTypesListFilters = {}) {
    const rows =
      await sql<SalesTypesRow>`SELECT id, uuid, name, description, is_active, sort_order FROM sales_types
      WHERE (${filters.search ?? ""} = '' OR LOWER(name) LIKE ${like(filters.search)} OR LOWER(description) LIKE ${like(filters.search)})
      ORDER BY sort_order, id`.execute(getCoreDatabase());
    return rows.rows.map(toSalesTypes);
  }

  async find(id: string) {
    const rows =
      await sql<SalesTypesRow>`SELECT id, uuid, name, description, is_active, sort_order FROM sales_types
      WHERE id=${id} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toSalesTypes(rows.rows[0]) : null;
  }

  async create(input: SalesTypesSavePayload) {
    const id = `salesTypes-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    await sql`INSERT INTO sales_types (id, uuid, name, description, is_active, sort_order) VALUES
      (${id}, ${uuid}, ${normalizeString(input.name)}, ${normalizeString(input.description)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})`.execute(
      getCoreDatabase()
    );
    return (await this.find(id))!;
  }

  async update(id: string, input: SalesTypesSavePayload) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE sales_types SET name=${normalizeString(input.name)}, description=${normalizeString(input.description)}, is_active=${input.isActive === false ? 0 : 1},
      sort_order=${numberValue(input.sortOrder, 1000)}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE sales_types SET is_active=${isActive ? 1 : 0}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`DELETE FROM sales_types WHERE id=${id}`.execute(getCoreDatabase());
    return existing;
  }
}

function canMutate(record: SalesTypesRecord) {
  if (String(record.name ?? "").trim() === "-" || String(record.description ?? "").trim() === "-")
    return false;
  return true;
}

function toSalesTypes(row: SalesTypesRow): SalesTypesRecord {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
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
