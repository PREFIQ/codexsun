import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type {
  CurrenciesListFilters,
  CurrenciesRecord,
  CurrenciesSavePayload
} from "./currencies.types.js";

type CurrenciesRow = {
  id: string;
  uuid: string;
  name: string;
  symbol: string;
  is_active: number | boolean;
  sort_order: number;
};

export class CurrenciesRepository {
  async list(filters: CurrenciesListFilters = {}) {
    const rows =
      await sql<CurrenciesRow>`SELECT id, uuid, name, symbol, is_active, sort_order FROM currencies
      WHERE (${filters.search ?? ""} = '' OR LOWER(name) LIKE ${like(filters.search)} OR LOWER(symbol) LIKE ${like(filters.search)})
      ORDER BY sort_order, id`.execute(getCoreDatabase());
    return rows.rows.map(toCurrencies);
  }

  async find(id: string) {
    const rows =
      await sql<CurrenciesRow>`SELECT id, uuid, name, symbol, is_active, sort_order FROM currencies
      WHERE id=${id} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toCurrencies(rows.rows[0]) : null;
  }

  async create(input: CurrenciesSavePayload) {
    const id = `currencies-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    await sql`INSERT INTO currencies (id, uuid, name, symbol, is_active, sort_order) VALUES
      (${id}, ${uuid}, ${normalizeString(input.name)}, ${normalizeString(input.symbol)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})`.execute(
      getCoreDatabase()
    );
    return (await this.find(id))!;
  }

  async update(id: string, input: CurrenciesSavePayload) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE currencies SET name=${normalizeString(input.name)}, symbol=${normalizeString(input.symbol)}, is_active=${input.isActive === false ? 0 : 1},
      sort_order=${numberValue(input.sortOrder, 1000)}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE currencies SET is_active=${isActive ? 1 : 0}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`DELETE FROM currencies WHERE id=${id}`.execute(getCoreDatabase());
    return existing;
  }
}

function canMutate(record: CurrenciesRecord) {
  if (String(record.name ?? "").trim() === "-" || String(record.symbol ?? "").trim() === "-")
    return false;
  return true;
}

function toCurrencies(row: CurrenciesRow): CurrenciesRecord {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    symbol: row.symbol,
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
