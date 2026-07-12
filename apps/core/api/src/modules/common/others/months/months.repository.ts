import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type { MonthsListFilters, MonthsRecord, MonthsSavePayload } from "./months.types.js";

type MonthsRow = {
  id: string;
  uuid: string;
  name: string;
  from_date: string;
  to_date: string;
  is_active: number | boolean;
  sort_order: number;
};

export class MonthsRepository {
  async list(filters: MonthsListFilters = {}) {
    const rows =
      await sql<MonthsRow>`SELECT id, uuid, name, from_date, to_date, is_active, sort_order FROM months
      WHERE (${filters.search ?? ""} = '' OR LOWER(name) LIKE ${like(filters.search)})
      ORDER BY sort_order, id`.execute(getCoreDatabase());
    return rows.rows.map(toMonths);
  }

  async find(id: string) {
    const rows =
      await sql<MonthsRow>`SELECT id, uuid, name, from_date, to_date, is_active, sort_order FROM months
      WHERE id=${id} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toMonths(rows.rows[0]) : null;
  }

  async create(input: MonthsSavePayload) {
    const id = `months-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    await sql`INSERT INTO months (id, uuid, name, from_date, to_date, is_active, sort_order) VALUES
      (${id}, ${uuid}, ${normalizeString(input.name)}, ${normalizeString(input.fromDate)}, ${normalizeString(input.toDate)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})`.execute(
      getCoreDatabase()
    );
    return (await this.find(id))!;
  }

  async update(id: string, input: MonthsSavePayload) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE months SET name=${normalizeString(input.name)}, from_date=${normalizeString(input.fromDate)}, to_date=${normalizeString(input.toDate)}, is_active=${input.isActive === false ? 0 : 1},
      sort_order=${numberValue(input.sortOrder, 1000)}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE months SET is_active=${isActive ? 1 : 0}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`DELETE FROM months WHERE id=${id}`.execute(getCoreDatabase());
    return existing;
  }
}

function canMutate(record: MonthsRecord) {
  if (
    String(record.name ?? "").trim() === "-" ||
    String(record.fromDate ?? "").trim() === "-" ||
    String(record.toDate ?? "").trim() === "-"
  )
    return false;
  return true;
}

function toMonths(row: MonthsRow): MonthsRecord {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    fromDate: row.from_date,
    toDate: row.to_date,
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
