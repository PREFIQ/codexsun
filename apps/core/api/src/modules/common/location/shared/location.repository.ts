import { randomBytes } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import { GLOBAL_LOCATION_TENANT_ID } from "./location.context.js";
import type { LocationDefinition, LocationListFilters, LocationRecord, LocationSavePayload } from "./location.types.js";

type LocationRow = {
  area_name: string | null;
  capital: string | null;
  city_id: string | null;
  city_name: string | null;
  code: string;
  country_id: string | null;
  country_name: string | null;
  currency_code: string | null;
  dial_code: string | null;
  district_id: string | null;
  district_name: string | null;
  gst_state_code: string | null;
  id: string;
  iso2: string | null;
  iso3: string | null;
  name: string;
  numeric_code: string | null;
  pincode: string | null;
  short_code: string | null;
  sort_order: number;
  state_id: string | null;
  state_name: string | null;
  status: "active" | "inactive";
  tenant_id: string;
  uuid: string;
};

export class LocationRepository {
  constructor(private readonly definition: LocationDefinition) {}

  async list(tenantId: string, filters: LocationListFilters = {}) {
    const rows = await sql<LocationRow>`
      SELECT *
      FROM ${sql.table(this.definition.tableName)}
      WHERE tenant_id IN (${GLOBAL_LOCATION_TENANT_ID}, ${tenantId})
        AND (${filters.countryId ?? ""} = '' OR country_id = ${filters.countryId ?? ""})
        AND (${filters.stateId ?? ""} = '' OR state_id = ${filters.stateId ?? ""})
        AND (${filters.districtId ?? ""} = '' OR district_id = ${filters.districtId ?? ""})
        AND (${filters.cityId ?? ""} = '' OR city_id = ${filters.cityId ?? ""})
        AND (
          ${filters.search ?? ""} = ''
          OR LOWER(name) LIKE ${like(filters.search)}
          OR LOWER(code) LIKE ${like(filters.search)}
          OR LOWER(COALESCE(pincode, '')) LIKE ${like(filters.search)}
        )
      ORDER BY sort_order ASC, name ASC
    `.execute(getCoreDatabase());
    return rows.rows.map(toLocationRecord);
  }

  async find(tenantId: string, id: string) {
    const row = await sql<LocationRow>`
      SELECT *
      FROM ${sql.table(this.definition.tableName)}
      WHERE id = ${id}
        AND tenant_id IN (${GLOBAL_LOCATION_TENANT_ID}, ${tenantId})
      LIMIT 1
    `.execute(getCoreDatabase());
    return row.rows[0] ? toLocationRecord(row.rows[0]) : null;
  }

  async create(tenantId: string, input: LocationSavePayload) {
    const id = input.id?.trim() || `${tenantId}-${this.definition.kind}-${slug(input.code || input.name)}`;
    const record = toPersistedRecord(id, tenantId, input);
    await insertLocation(this.definition.tableName, record);
    return record;
  }

  async update(tenantId: string, id: string, input: LocationSavePayload) {
    const existing = await this.find(tenantId, id);
    if (!existing || existing.tenantId === GLOBAL_LOCATION_TENANT_ID) return null;
    const record = { ...toPersistedRecord(id, tenantId, input), uuid: existing.uuid };
    await updateLocation(this.definition.tableName, id, tenantId, record);
    return record;
  }

  async setStatus(tenantId: string, id: string, status: LocationRecord["status"]) {
    const existing = await this.find(tenantId, id);
    if (!existing || existing.tenantId === GLOBAL_LOCATION_TENANT_ID) return null;
    await sql`
      UPDATE ${sql.table(this.definition.tableName)}
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `.execute(getCoreDatabase());
    return { ...existing, status };
  }
}

export async function seedLocationRecord(tableName: string, input: LocationSavePayload & { id: string; tenantId?: string }) {
  const record = toPersistedRecord(input.id, input.tenantId ?? GLOBAL_LOCATION_TENANT_ID, input);
  await sql`
    INSERT INTO ${sql.table(tableName)} (
      id, uuid, tenant_id, code, name, status, sort_order, country_id, state_id, district_id, city_id,
      iso2, iso3, numeric_code, dial_code, currency_code, capital, gst_state_code, short_code,
      pincode, area_name, city_name, district_name, state_name, country_name
    )
    VALUES (
      ${record.id}, ${record.uuid}, ${record.tenantId}, ${record.code}, ${record.name}, ${record.status}, ${record.sortOrder},
      ${record.countryId}, ${record.stateId}, ${record.districtId}, ${record.cityId}, ${record.iso2}, ${record.iso3},
      ${record.numericCode}, ${record.dialCode}, ${record.currencyCode}, ${record.capital}, ${record.gstStateCode},
      ${record.shortCode}, ${record.pincode}, ${record.areaName}, ${record.cityName}, ${record.districtName},
      ${record.stateName}, ${record.countryName}
    )
    ON DUPLICATE KEY UPDATE
      code = VALUES(code), name = VALUES(name), status = VALUES(status), sort_order = VALUES(sort_order),
      country_id = VALUES(country_id), state_id = VALUES(state_id), district_id = VALUES(district_id), city_id = VALUES(city_id),
      iso2 = VALUES(iso2), iso3 = VALUES(iso3), numeric_code = VALUES(numeric_code), dial_code = VALUES(dial_code),
      currency_code = VALUES(currency_code), capital = VALUES(capital), gst_state_code = VALUES(gst_state_code),
      short_code = VALUES(short_code), pincode = VALUES(pincode), area_name = VALUES(area_name), city_name = VALUES(city_name),
      district_name = VALUES(district_name), state_name = VALUES(state_name), country_name = VALUES(country_name),
      updated_at = CURRENT_TIMESTAMP
  `.execute(getCoreDatabase());
}

function toPersistedRecord(id: string, tenantId: string, input: LocationSavePayload): LocationRecord {
  return {
    areaName: cleanOptional(input.areaName),
    capital: cleanOptional(input.capital),
    cityId: cleanOptional(input.cityId),
    cityName: cleanOptional(input.cityName),
    code: cleanRequired(input.code),
    countryId: cleanOptional(input.countryId),
    countryName: cleanOptional(input.countryName),
    currencyCode: cleanOptional(input.currencyCode),
    dialCode: cleanOptional(input.dialCode),
    districtId: cleanOptional(input.districtId),
    districtName: cleanOptional(input.districtName),
    gstStateCode: cleanOptional(input.gstStateCode),
    id,
    iso2: cleanOptional(input.iso2)?.toUpperCase() ?? null,
    iso3: cleanOptional(input.iso3)?.toUpperCase() ?? null,
    name: cleanRequired(input.name),
    numericCode: cleanOptional(input.numericCode),
    pincode: cleanOptional(input.pincode),
    shortCode: cleanOptional(input.shortCode)?.toUpperCase() ?? null,
    sortOrder: Number.isFinite(input.sortOrder) ? input.sortOrder : 1000,
    stateId: cleanOptional(input.stateId),
    stateName: cleanOptional(input.stateName),
    status: input.status === "inactive" ? "inactive" : "active",
    tenantId,
    uuid: createPublicUuid()
  };
}

async function insertLocation(tableName: string, record: LocationRecord) {
  await sql`
    INSERT INTO ${sql.table(tableName)} (
      id, uuid, tenant_id, code, name, status, sort_order, country_id, state_id, district_id, city_id,
      iso2, iso3, numeric_code, dial_code, currency_code, capital, gst_state_code, short_code,
      pincode, area_name, city_name, district_name, state_name, country_name
    )
    VALUES (
      ${record.id}, ${record.uuid}, ${record.tenantId}, ${record.code}, ${record.name}, ${record.status}, ${record.sortOrder},
      ${record.countryId}, ${record.stateId}, ${record.districtId}, ${record.cityId}, ${record.iso2}, ${record.iso3},
      ${record.numericCode}, ${record.dialCode}, ${record.currencyCode}, ${record.capital}, ${record.gstStateCode},
      ${record.shortCode}, ${record.pincode}, ${record.areaName}, ${record.cityName}, ${record.districtName},
      ${record.stateName}, ${record.countryName}
    )
  `.execute(getCoreDatabase());
}

async function updateLocation(tableName: string, id: string, tenantId: string, record: LocationRecord) {
  await sql`
    UPDATE ${sql.table(tableName)}
    SET code = ${record.code}, name = ${record.name}, status = ${record.status}, sort_order = ${record.sortOrder},
      country_id = ${record.countryId}, state_id = ${record.stateId}, district_id = ${record.districtId}, city_id = ${record.cityId},
      iso2 = ${record.iso2}, iso3 = ${record.iso3}, numeric_code = ${record.numericCode}, dial_code = ${record.dialCode},
      currency_code = ${record.currencyCode}, capital = ${record.capital}, gst_state_code = ${record.gstStateCode},
      short_code = ${record.shortCode}, pincode = ${record.pincode}, area_name = ${record.areaName}, city_name = ${record.cityName},
      district_name = ${record.districtName}, state_name = ${record.stateName}, country_name = ${record.countryName},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND tenant_id = ${tenantId}
  `.execute(getCoreDatabase());
}

function toLocationRecord(row: LocationRow): LocationRecord {
  return {
    areaName: row.area_name,
    capital: row.capital,
    cityId: row.city_id,
    cityName: row.city_name,
    code: row.code,
    countryId: row.country_id,
    countryName: row.country_name,
    currencyCode: row.currency_code,
    dialCode: row.dial_code,
    districtId: row.district_id,
    districtName: row.district_name,
    gstStateCode: row.gst_state_code,
    id: row.id,
    iso2: row.iso2,
    iso3: row.iso3,
    name: row.name,
    numericCode: row.numeric_code,
    pincode: row.pincode,
    shortCode: row.short_code,
    sortOrder: Number(row.sort_order),
    stateId: row.state_id,
    stateName: row.state_name,
    status: row.status,
    tenantId: row.tenant_id,
    uuid: row.uuid
  };
}

function cleanRequired(value: string) {
  const cleaned = value.trim();
  if (!cleaned) throw new Error("Location records require a name and code.");
  return cleaned;
}

function cleanOptional(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function createPublicUuid() {
  return randomBytes(4).toString("hex");
}

function like(value: string | undefined) {
  return `%${(value ?? "").trim().toLowerCase()}%`;
}

function slug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "record";
}
