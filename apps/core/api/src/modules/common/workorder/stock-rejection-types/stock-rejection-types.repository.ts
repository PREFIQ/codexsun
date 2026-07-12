import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type {
  StockRejectionTypesListFilters,
  StockRejectionTypesRecord,
  StockRejectionTypesSavePayload
} from "./stock-rejection-types.types.js";

type StockRejectionTypesRow = {
  id: string;
  uuid: string;
  name: string;
  is_active: number | boolean;
  sort_order: number;
};

export class StockRejectionTypesRepository {
  async list(filters: StockRejectionTypesListFilters = {}) {
    const rows =
      await sql<StockRejectionTypesRow>`SELECT id, uuid, name, is_active, sort_order FROM stock_rejection_types
      WHERE (${filters.search ?? ""} = '' OR LOWER(name) LIKE ${like(filters.search)})
      ORDER BY sort_order, id`.execute(getCoreDatabase());
    return rows.rows.map(toStockRejectionTypes);
  }

  async find(id: string) {
    const rows =
      await sql<StockRejectionTypesRow>`SELECT id, uuid, name, is_active, sort_order FROM stock_rejection_types
      WHERE id=${id} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toStockRejectionTypes(rows.rows[0]) : null;
  }

  async create(input: StockRejectionTypesSavePayload) {
    const id = `stockRejectionTypes-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    await sql`INSERT INTO stock_rejection_types (id, uuid, name, is_active, sort_order) VALUES
      (${id}, ${uuid}, ${normalizeString(input.name)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})`.execute(
      getCoreDatabase()
    );
    return (await this.find(id))!;
  }

  async update(id: string, input: StockRejectionTypesSavePayload) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE stock_rejection_types SET name=${normalizeString(input.name)}, is_active=${input.isActive === false ? 0 : 1},
      sort_order=${numberValue(input.sortOrder, 1000)}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE stock_rejection_types SET is_active=${isActive ? 1 : 0}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`DELETE FROM stock_rejection_types WHERE id=${id}`.execute(getCoreDatabase());
    return existing;
  }
}

function canMutate(record: StockRejectionTypesRecord) {
  if (String(record.name ?? "").trim() === "-") return false;
  return true;
}

function toStockRejectionTypes(row: StockRejectionTypesRow): StockRejectionTypesRecord {
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
