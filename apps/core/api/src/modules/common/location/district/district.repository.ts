import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type {
  District,
  DistrictListFilters,
  DistrictSavePayload,
  DistrictStatus
} from "./district.types.js";

type DistrictRow = {
  id: number;
  uuid: string;
  state_id: number;
  state_name: string;
  country_id: number;
  country_name: string;
  name: string;
  sort_order: number;
  status: DistrictStatus;
};

export class DistrictRepository {
  async list(filters: DistrictListFilters = {}) {
    const rows = await sql<DistrictRow>`SELECT districts.id, districts.uuid, districts.state_id,
        states.name state_name, states.country_id, countries.name country_name,
        districts.name, districts.sort_order, districts.status
      FROM districts
      INNER JOIN states ON states.id = districts.state_id
      INNER JOIN countries ON countries.id = states.country_id
      WHERE (${filters.stateId ?? ""} = '' OR districts.state_id = ${Number(filters.stateId ?? 0)})
        AND (${filters.search ?? ""} = '' OR LOWER(districts.name) LIKE ${like(filters.search)}
          OR LOWER(states.name) LIKE ${like(filters.search)} OR LOWER(countries.name) LIKE ${like(filters.search)})
      ORDER BY districts.sort_order, districts.name`.execute(getCoreDatabase());
    return rows.rows.map(toDistrict);
  }

  async find(id: string) {
    const rows = await sql<DistrictRow>`SELECT districts.id, districts.uuid, districts.state_id,
        states.name state_name, states.country_id, countries.name country_name,
        districts.name, districts.sort_order, districts.status
      FROM districts
      INNER JOIN states ON states.id = districts.state_id
      INNER JOIN countries ON countries.id = states.country_id
      WHERE districts.id=${Number(id)} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toDistrict(rows.rows[0]) : null;
  }

  async stateExists(stateId: string) {
    const rows = await sql<{
      id: number;
    }>`SELECT id FROM states WHERE id=${Number(stateId)} LIMIT 1`.execute(getCoreDatabase());
    return Boolean(rows.rows[0]);
  }

  async create(input: DistrictSavePayload) {
    const result = await sql`INSERT INTO districts (uuid, state_id, name, sort_order, status) VALUES
      (${randomBytes(4).toString("hex")}, ${Number(input.stateId)}, ${input.name}, ${input.sortOrder}, ${input.status})`.execute(
      getCoreDatabase()
    );
    return (await this.find(String(result.insertId)))!;
  }

  async update(id: string, input: DistrictSavePayload) {
    await sql`UPDATE districts SET state_id=${Number(input.stateId)}, name=${input.name}, sort_order=${input.sortOrder}, status=${input.status} WHERE id=${Number(id)}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setStatus(id: string, status: DistrictStatus) {
    await sql`UPDATE districts SET status=${status} WHERE id=${Number(id)}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing) return null;
    await sql`DELETE FROM districts WHERE id=${Number(id)}`.execute(getCoreDatabase());
    return existing;
  }

  async dependentCount(id: string) {
    const rows = await sql<{
      count: number | string;
    }>`SELECT COUNT(*) count FROM cities WHERE district_id=${Number(id)}`.execute(
      getCoreDatabase()
    );
    return Number(rows.rows[0]?.count ?? 0);
  }
}

function toDistrict(row: DistrictRow): District {
  return {
    id: String(row.id),
    uuid: row.uuid,
    stateId: String(row.state_id),
    stateName: row.state_name,
    countryId: String(row.country_id),
    countryName: row.country_name,
    name: row.name,
    sortOrder: Number(row.sort_order),
    status: row.status
  };
}

function like(value?: string) {
  return `%${(value ?? "").trim().toLowerCase()}%`;
}
