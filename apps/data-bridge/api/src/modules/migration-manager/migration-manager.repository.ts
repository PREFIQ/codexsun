import type { CompatibleDbPool } from "@codexsun/framework/db";
import type { DatabaseSettings, MigrationJobInput } from "./migration-manager.types.js";

type Row = Record<string, unknown>;

export class MigrationManagerRepository {
  constructor(private readonly db: CompatibleDbPool) {}

  async initialize() {
    await this.db.execute(`CREATE TABLE IF NOT EXISTS data_bridge_migration_jobs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(160) NOT NULL UNIQUE, tenant VARCHAR(160) NOT NULL, status VARCHAR(24) NOT NULL DEFAULT 'draft',
      source_type VARCHAR(24) NOT NULL, source_host VARCHAR(255) NOT NULL, source_port INT NOT NULL,
      source_database VARCHAR(160) NOT NULL, source_user VARCHAR(160) NOT NULL, source_password TEXT NOT NULL,
      target_type VARCHAR(24) NOT NULL, target_host VARCHAR(255) NOT NULL, target_port INT NOT NULL,
      target_database VARCHAR(160) NOT NULL, target_user VARCHAR(160) NOT NULL, target_password TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`);
  }

  async list() {
    const [rows] = await this.db.execute<Row[]>("SELECT * FROM data_bridge_migration_jobs ORDER BY id DESC");
    return rows.map(toPublicJob);
  }

  async get(id: number) {
    const [rows] = await this.db.execute<Row[]>("SELECT * FROM data_bridge_migration_jobs WHERE id = ?", [id]);
    return rows[0] ? toPublicJob(rows[0]) : null;
  }

  async create(input: MigrationJobInput) {
    const values = jobValues(input);
    const [result] = await this.db.execute<{ insertId: number }>(`INSERT INTO data_bridge_migration_jobs
      (name, tenant, status, source_type, source_host, source_port, source_database, source_user, source_password,
       target_type, target_host, target_port, target_database, target_user, target_password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, values);
    return this.get(Number(result.insertId));
  }

  async update(id: number, input: MigrationJobInput) {
    const current = await this.secretSettings(id);
    if (!current) return null;
    const normalized = {
      ...input,
      source: { ...input.source, password: input.source.password || current.source.password },
      target: { ...input.target, password: input.target.password || current.target.password }
    };
    await this.db.execute(`UPDATE data_bridge_migration_jobs SET name=?, tenant=?, status=?, source_type=?, source_host=?,
      source_port=?, source_database=?, source_user=?, source_password=?, target_type=?, target_host=?, target_port=?,
      target_database=?, target_user=?, target_password=? WHERE id=?`, [...jobValues(normalized), id]);
    return this.get(id);
  }

  async secretSettings(id: number) {
    const [rows] = await this.db.execute<Row[]>("SELECT * FROM data_bridge_migration_jobs WHERE id = ?", [id]);
    const row = rows[0];
    return row ? { source: settings(row, "source", true), target: settings(row, "target", true) } : null;
  }
}

function jobValues(input: MigrationJobInput) {
  return [input.name, input.tenant, input.status, input.source.type, input.source.host, input.source.port,
    input.source.database, input.source.user, input.source.password ?? "", input.target.type, input.target.host,
    input.target.port, input.target.database, input.target.user, input.target.password ?? ""];
}
function settings(row: Row, side: "source" | "target", includePassword = false): DatabaseSettings {
  return { type: String(row[`${side}_type`]) as DatabaseSettings["type"], host: String(row[`${side}_host`]), port: Number(row[`${side}_port`]),
    database: String(row[`${side}_database`]), user: String(row[`${side}_user`]), password: includePassword ? String(row[`${side}_password`]) : "" };
}
function toPublicJob(row: Row) {
  return { id: Number(row.id), name: row.name, tenant: row.tenant, status: row.status, source: settings(row, "source"),
    target: settings(row, "target"), createdAt: row.created_at, updatedAt: row.updated_at };
}
