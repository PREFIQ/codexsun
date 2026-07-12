import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type { TaxesListFilters, TaxesRecord, TaxesSavePayload } from "./taxes.types.js";

type TaxesRow = {
  id: string;
  uuid: string;
  rate_percent: number;
  description: string;
  is_active: number | boolean;
  sort_order: number;
};

export class TaxesRepository {
  async list(filters: TaxesListFilters = {}) {
    const rows =
      await sql<TaxesRow>`SELECT id, uuid, rate_percent, description, is_active, sort_order FROM taxes
      WHERE (${filters.search ?? ""} = '' OR LOWER(description) LIKE ${like(filters.search)})
      ORDER BY sort_order, id`.execute(getCoreDatabase());
    return rows.rows.map(toTaxes);
  }

  async find(id: string) {
    const rows =
      await sql<TaxesRow>`SELECT id, uuid, rate_percent, description, is_active, sort_order FROM taxes
      WHERE id=${id} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toTaxes(rows.rows[0]) : null;
  }

  async create(input: TaxesSavePayload) {
    const id = `taxes-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    await sql`INSERT INTO taxes (id, uuid, rate_percent, description, is_active, sort_order) VALUES
      (${id}, ${uuid}, ${normalizeNumber(input.ratePercent)}, ${normalizeString(input.description)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})`.execute(
      getCoreDatabase()
    );
    return (await this.find(id))!;
  }

  async update(id: string, input: TaxesSavePayload) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE taxes SET rate_percent=${normalizeNumber(input.ratePercent)}, description=${normalizeString(input.description)}, is_active=${input.isActive === false ? 0 : 1},
      sort_order=${numberValue(input.sortOrder, 1000)}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE taxes SET is_active=${isActive ? 1 : 0}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`DELETE FROM taxes WHERE id=${id}`.execute(getCoreDatabase());
    return existing;
  }
}

function canMutate(record: TaxesRecord) {
  if (
    String(record.ratePercent ?? "").trim() === "-" ||
    String(record.description ?? "").trim() === "-"
  )
    return false;
  return true;
}

function toTaxes(row: TaxesRow): TaxesRecord {
  return {
    id: row.id,
    uuid: row.uuid,
    ratePercent: Number(row.rate_percent),
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

function normalizeNumber(value: unknown) {
  return numberValue(value, 0);
}

function normalizeString(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}
