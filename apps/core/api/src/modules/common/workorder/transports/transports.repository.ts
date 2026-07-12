import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";
import type {
  TransportsListFilters,
  TransportsRecord,
  TransportsSavePayload
} from "./transports.types.js";

type TransportsRow = {
  id: string;
  uuid: string;
  name: string;
  gst: string | null;
  vehicle_no: string | null;
  address: string | null;
  contact_no: string | null;
  contact_person: string | null;
  is_active: number | boolean;
  sort_order: number;
};

export class TransportsRepository {
  async list(filters: TransportsListFilters = {}) {
    const rows =
      await sql<TransportsRow>`SELECT id, uuid, name, gst, vehicle_no, address, contact_no, contact_person, is_active, sort_order FROM transports
      WHERE (${filters.search ?? ""} = '' OR LOWER(name) LIKE ${like(filters.search)} OR LOWER(gst) LIKE ${like(filters.search)} OR LOWER(vehicle_no) LIKE ${like(filters.search)} OR LOWER(address) LIKE ${like(filters.search)} OR LOWER(contact_no) LIKE ${like(filters.search)} OR LOWER(contact_person) LIKE ${like(filters.search)})
      ORDER BY sort_order, id`.execute(getCoreDatabase());
    return rows.rows.map(toTransports);
  }

  async find(id: string) {
    const rows =
      await sql<TransportsRow>`SELECT id, uuid, name, gst, vehicle_no, address, contact_no, contact_person, is_active, sort_order FROM transports
      WHERE id=${id} LIMIT 1`.execute(getCoreDatabase());
    return rows.rows[0] ? toTransports(rows.rows[0]) : null;
  }

  async create(input: TransportsSavePayload) {
    const id = `transports-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    await sql`INSERT INTO transports (id, uuid, name, gst, vehicle_no, address, contact_no, contact_person, is_active, sort_order) VALUES
      (${id}, ${uuid}, ${normalizeString(input.name)}, ${normalizeString(input.gst)}, ${normalizeString(input.vehicleNo)}, ${normalizeString(input.address)}, ${normalizeString(input.contactNo)}, ${normalizeString(input.contactPerson)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})`.execute(
      getCoreDatabase()
    );
    return (await this.find(id))!;
  }

  async update(id: string, input: TransportsSavePayload) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE transports SET name=${normalizeString(input.name)}, gst=${normalizeString(input.gst)}, vehicle_no=${normalizeString(input.vehicleNo)}, address=${normalizeString(input.address)}, contact_no=${normalizeString(input.contactNo)}, contact_person=${normalizeString(input.contactPerson)}, is_active=${input.isActive === false ? 0 : 1},
      sort_order=${numberValue(input.sortOrder, 1000)}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async setActive(id: string, isActive: boolean) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`UPDATE transports SET is_active=${isActive ? 1 : 0}, updated_at=CURRENT_TIMESTAMP WHERE id=${id}`.execute(
      getCoreDatabase()
    );
    return this.find(id);
  }

  async forceDelete(id: string) {
    const existing = await this.find(id);
    if (!existing || !canMutate(existing)) return null;
    await sql`DELETE FROM transports WHERE id=${id}`.execute(getCoreDatabase());
    return existing;
  }
}

function canMutate(record: TransportsRecord) {
  if (
    String(record.name ?? "").trim() === "-" ||
    String(record.gst ?? "").trim() === "-" ||
    String(record.vehicleNo ?? "").trim() === "-" ||
    String(record.address ?? "").trim() === "-" ||
    String(record.contactNo ?? "").trim() === "-" ||
    String(record.contactPerson ?? "").trim() === "-"
  )
    return false;
  return true;
}

function toTransports(row: TransportsRow): TransportsRecord {
  return {
    id: row.id,
    uuid: row.uuid,
    name: row.name,
    gst: row.gst,
    vehicleNo: row.vehicle_no,
    address: row.address,
    contactNo: row.contact_no,
    contactPerson: row.contact_person,
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
