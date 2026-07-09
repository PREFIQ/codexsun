import { randomUUID } from "node:crypto";
import { sql } from "kysely";
import { getCoreDatabase } from "../../../database/core-database.js";
import type { CommonMasterDefinition, CommonMasterRecord } from "./common-master.types.js";

export class CommonMasterRepository {
  constructor(private readonly definition: CommonMasterDefinition) {}

  async list(tenantId: string) {
    const result = await sql<Record<string, unknown>>`
      SELECT * FROM ${sql.table(this.definition.tableName)}
      WHERE tenant_id IN ('global', ${tenantId})
      ORDER BY sort_order, id
    `.execute(getCoreDatabase());
    return result.rows.map((row) => this.toRecord(row));
  }

  async find(tenantId: string, id: string) {
    const result = await sql<Record<string, unknown>>`
      SELECT * FROM ${sql.table(this.definition.tableName)}
      WHERE id = ${id} AND tenant_id IN ('global', ${tenantId})
      LIMIT 1
    `.execute(getCoreDatabase());
    return result.rows[0] ? this.toRecord(result.rows[0]) : null;
  }

  async create(tenantId: string, input: Record<string, unknown>) {
    const id = `${tenantId}-${this.definition.key}-${randomUUID()}`;
    const uuid = randomUUID().replaceAll("-", "").slice(0, 8);
    const columns = this.definition.fields.map((field) => sql.raw(`\`${field.column}\``));
    const values = this.definition.fields.map((field) => sql`${normalizeValue(input[field.key], field.type)}`);
    await sql`
      INSERT INTO ${sql.table(this.definition.tableName)}
      (id, uuid, tenant_id, ${sql.join(columns)}, is_active, sort_order)
      VALUES (${id}, ${uuid}, ${tenantId}, ${sql.join(values)}, ${input.isActive === false ? 0 : 1}, ${numberValue(input.sortOrder, 1000)})
    `.execute(getCoreDatabase());
    return this.find(tenantId, id);
  }

  async update(tenantId: string, id: string, input: Record<string, unknown>) {
    const assignments = this.definition.fields.map(
      (field) => sql`${sql.raw(`\`${field.column}\``)} = ${normalizeValue(input[field.key], field.type)}`
    );
    await sql`
      UPDATE ${sql.table(this.definition.tableName)}
      SET ${sql.join(assignments)}, is_active = ${input.isActive === false ? 0 : 1},
          sort_order = ${numberValue(input.sortOrder, 1000)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `.execute(getCoreDatabase());
    return this.find(tenantId, id);
  }

  async setActive(tenantId: string, id: string, isActive: boolean) {
    await sql`
      UPDATE ${sql.table(this.definition.tableName)}
      SET is_active = ${isActive ? 1 : 0}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `.execute(getCoreDatabase());
    return this.find(tenantId, id);
  }

  private toRecord(row: Record<string, unknown>): CommonMasterRecord {
    const record: CommonMasterRecord = {
      id: String(row.id),
      isActive: Boolean(row.is_active),
      tenantId: String(row.tenant_id),
      uuid: String(row.uuid)
    };
    for (const field of this.definition.fields) {
      record[field.key] = field.type === "boolean" ? Boolean(row[field.column]) : valueOrNull(row[field.column]);
    }
    return record;
  }
}

function normalizeValue(value: unknown, type: string) {
  if (type === "boolean") return value === true ? 1 : 0;
  if (type === "number") return numberValue(value, 0);
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function numberValue(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function valueOrNull(value: unknown): string | number | null {
  return typeof value === "number" || typeof value === "string" ? value : null;
}
