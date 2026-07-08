import { sql, type Kysely } from "kysely";
import type { PlatformDatabase } from "../../database/schema.js";

export async function migrateDatabaseMaintenanceModule(db: Kysely<PlatformDatabase>) {
  await db.schema
    .createTable("database_maintenance_runs")
    .ifNotExists()
    .addColumn("id", "integer", (column) => column.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (column) => column.notNull().unique())
    .addColumn("database_scope", "varchar(24)", (column) => column.notNull())
    .addColumn("target_key", "varchar(160)", (column) => column.notNull())
    .addColumn("database_name", "varchar(160)", (column) => column.notNull())
    .addColumn("operation", "varchar(24)", (column) => column.notNull())
    .addColumn("status", "varchar(24)", (column) => column.notNull())
    .addColumn("details_json", "json", (column) => column.notNull())
    .addColumn("created_at", "datetime", (column) => column.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("completed_at", "datetime")
    .execute();
}
