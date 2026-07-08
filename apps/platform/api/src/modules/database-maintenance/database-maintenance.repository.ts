import { randomBytes } from "node:crypto";
import { createConnection } from "mysql2/promise";
import { env } from "../../env.js";
import { platformDatabaseName } from "../../database/platform-database.js";
import type { Tenant } from "../tenant/index.js";
import { TenantRepository } from "../tenant/index.js";
import type { DatabaseMaintenanceRun, DatabaseOperation, DatabaseRunStatus, DatabaseScope } from "./database-maintenance.types.js";
import { getPlatformDatabase } from "../../database/platform-database.js";

export class DatabaseMaintenanceRepository {
  constructor(private readonly tenants = new TenantRepository()) {}

  async masterStatus() {
    const databaseName = platformDatabaseName();
    const probe = await this.probeDatabase({ databaseName, host: env.DB_HOST, port: env.DB_PORT, user: env.DB_USER });
    return {
      backupStatus: process.env.CODEXSUN_BACKUP_VERIFY_ID ? "verified" as const : "operator-required" as const,
      databaseName,
      host: env.DB_HOST,
      migrations: await this.masterMigrations(databaseName),
      port: env.DB_PORT,
      restoreStatus: process.env.CODEXSUN_RESTORE_TEST_DB_NAME ? "sandbox-configured" as const : "not-configured" as const,
      runs: await this.runs("master", "master"),
      ...probe
    };
  }

  async tenantStatuses() {
    const tenants = await this.tenants.list();
    return Promise.all(tenants.map((tenant) => this.tenantStatus(tenant)));
  }

  async tenantStatus(tenant: Tenant) {
    const probe = await this.probeDatabase({ databaseName: tenant.dbName, host: tenant.dbHost || env.DB_HOST, port: tenant.dbPort || env.DB_PORT, user: tenant.dbUser || env.DB_USER });
    return {
      databaseName: tenant.dbName,
      host: tenant.dbHost || env.DB_HOST,
      migrations: await this.tenantMigrations(tenant),
      port: tenant.dbPort || env.DB_PORT,
      runs: await this.runs("tenant", String(tenant.id)),
      tenantCode: tenant.tenantCode,
      tenantId: tenant.id,
      tenantName: tenant.tenantName,
      ...probe
    };
  }

  async findTenant(id: number) {
    return this.tenants.findByIdOrCode(String(id));
  }

  async recordRun(input: { databaseName: string; details?: Record<string, unknown>; operation: DatabaseOperation; scope: DatabaseScope; status: DatabaseRunStatus; targetKey: string }) {
    const result = await getPlatformDatabase()
      .insertInto("database_maintenance_runs")
      .values({
        completed_at: input.status === "completed" || input.status === "failed" ? new Date() : null,
        database_name: input.databaseName,
        database_scope: input.scope,
        details_json: JSON.stringify(input.details ?? {}),
        operation: input.operation,
        status: input.status,
        target_key: input.targetKey,
        uuid: randomBytes(4).toString("hex")
      })
      .executeTakeFirst();
    return (await this.runs(input.scope, input.targetKey)).find((run) => run.id === Number(result.insertId)) ?? null;
  }

  async findRun(id: number) {
    const row = await getPlatformDatabase()
      .selectFrom("database_maintenance_runs")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toRun(row) : null;
  }

  async updateRunStatus(id: number, status: DatabaseRunStatus, details: Record<string, unknown>) {
    await getPlatformDatabase()
      .updateTable("database_maintenance_runs")
      .set({
        completed_at: status === "completed" || status === "failed" ? new Date() : null,
        details_json: JSON.stringify(details),
        status
      })
      .where("id", "=", id)
      .execute();
    return this.findRun(id);
  }

  private async runs(scope: DatabaseScope, targetKey: string) {
    const rows = await getPlatformDatabase()
      .selectFrom("database_maintenance_runs")
      .selectAll()
      .where("database_scope", "=", scope)
      .where("target_key", "=", targetKey)
      .orderBy("created_at", "desc")
      .orderBy("id", "desc")
      .limit(10)
      .execute();
    return rows.map(toRun);
  }

  private async probeDatabase(input: { databaseName: string; host: string; port: number; user: string }) {
    try {
      const connection = await createConnection({ database: input.databaseName, host: input.host, password: env.DB_PASSWORD, port: input.port, timezone: "Z", user: input.user });
      try {
        const [versionRows] = await connection.query("SELECT VERSION() as version");
        const [tableRows] = await connection.query("SHOW TABLES");
        const version = Array.isArray(versionRows) && versionRows[0] && typeof (versionRows[0] as { version?: unknown }).version === "string" ? String((versionRows[0] as { version: string }).version) : "unknown";
        return { status: "online" as const, tableCount: Array.isArray(tableRows) ? tableRows.length : 0, version };
      } finally {
        await connection.end();
      }
    } catch {
      return { status: "offline" as const, tableCount: 0, version: "unreachable" };
    }
  }

  private async masterMigrations(databaseName: string) {
    try {
      const connection = await createConnection({ database: databaseName, host: env.DB_HOST, password: env.DB_PASSWORD, port: env.DB_PORT, timezone: "Z", user: env.DB_USER });
      try {
        const [rows] = await connection.query("SELECT name, applied_at FROM codexsun_migrations ORDER BY applied_at, id");
        return Array.isArray(rows) ? rows.map((row) => ({ appliedAt: new Date((row as { applied_at: Date | string }).applied_at).toISOString(), name: String((row as { name: string }).name) })) : [];
      } finally {
        await connection.end();
      }
    } catch {
      return [];
    }
  }

  private async tenantMigrations(tenant: Tenant) {
    try {
      const connection = await createConnection({ database: tenant.dbName, host: tenant.dbHost || env.DB_HOST, password: env.DB_PASSWORD, port: tenant.dbPort || env.DB_PORT, timezone: "Z", user: tenant.dbUser || env.DB_USER });
      try {
        const [rows] = await connection.query("SELECT name, applied_at FROM tenant_migrations ORDER BY applied_at, id");
        return Array.isArray(rows) ? rows.map((row) => ({ appliedAt: new Date((row as { applied_at: Date | string }).applied_at).toISOString(), name: String((row as { name: string }).name) })) : [];
      } finally {
        await connection.end();
      }
    } catch {
      return [];
    }
  }
}

function toRun(row: {
  completed_at: Date | string | null;
  created_at: Date | string;
  database_name: string;
  database_scope: DatabaseScope;
  details_json: string;
  id: number;
  operation: DatabaseOperation;
  status: DatabaseRunStatus;
  target_key: string;
  uuid: string;
}): DatabaseMaintenanceRun {
  return {
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    databaseName: row.database_name,
    details: parseDetails(row.details_json),
    id: Number(row.id),
    operation: row.operation,
    scope: row.database_scope,
    status: row.status,
    targetKey: row.target_key,
    uuid: row.uuid
  };
}

function parseDetails(value: string) {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
