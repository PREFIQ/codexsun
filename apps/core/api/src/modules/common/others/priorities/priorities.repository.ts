import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type {
  PrioritiesListFilters,
  PrioritiesRecord,
  PrioritiesSavePayload
} from "./priorities.types.js";

type PrioritiesRow = {
  id: string;
  uuid: string;
  name: string;
  colour: string;
  tag: string;
  is_active: number | boolean;
  sort_order: number;
};

export class PrioritiesRepository {
  async list(filters: PrioritiesListFilters = {}) {
    const rows =
      await sql<PrioritiesRow>`SELECT id, uuid, name, colour, tag, is_active, sort_order FROM priorities
      WHERE (${filters.search ?? ""} = '' OR LOWER(name) LIKE ${like(filters.search)} OR LOWER(colour) LIKE ${like(filters.search)} OR LOWER(tag) LIKE ${like(filters.search)})
      ORDER BY sort_order, id`.execute(getCoreDatabase());
    return rows.rows.map(toPriorities);
  }

  async find(id: string) {
    const rows =
      await sql<PrioritiesRow>`SELECT id, uuid, name, colour, tag, is_active, sort_order FROM priorities
      WHERE id=${id} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toPriorities(rows.rows[0]) : null;
  }

  async create(input: PrioritiesSavePayload) {
    const id = `priorities-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    await sql`INSERT INTO priorities (id, uuid, name, colour, tag, is_active, sort_order) VALUES
      (${id}, ${uuid}, ${normalizeString(input.name)}, ${normalizeString(input.colour)}, ${normalizeString(input.tag)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})`.execute(
      getCoreDatabase()
    );
    return (await this.find(id))!;
  }

  async update(id: string, input: PrioritiesSavePayload) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE priorities SET name=${normalizeString(input.name)}, colour=${normalizeString(input.colour)}, tag=${normalizeString(input.tag)}, is_active=${input.isActive === false ? 0 : 1},
      sort_order=${numberValue(input.sortOrder, 1000)}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE priorities SET is_active=${isActive ? 1 : 0}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`DELETE FROM priorities WHERE id=${id}`.execute(getCoreDatabase());
    return existing;
  }
}

function canMutate(record: PrioritiesRecord) {
  if (
    String(record.name ?? "").trim() === "-" ||
    String(record.colour ?? "").trim() === "-" ||
    String(record.tag ?? "").trim() === "-"
  )
    return false;
  return true;
}

function toPriorities(row: PrioritiesRow): PrioritiesRecord {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    colour: row.colour,
    tag: row.tag,
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
