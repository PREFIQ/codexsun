import { sql, type Kysely } from "kysely";
import type { PlatformDatabase } from "../../database/schema.js";

export async function migrateStorageManagerModule(database: Kysely<PlatformDatabase>) {
  await addColumnIfMissing(database, "tenants", "storage_root", "VARCHAR(255) NOT NULL DEFAULT ''");
  await addColumnIfMissing(database, "tenants", "storage_public_root", "VARCHAR(255) NOT NULL DEFAULT ''");
  await addColumnIfMissing(database, "tenants", "storage_private_root", "VARCHAR(255) NOT NULL DEFAULT ''");

  await database.schema
    .createTable("storage_objects")
    .ifNotExists()
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("uuid", "varchar(8)", (col) => col.notNull().unique())
    .addColumn("scope", "varchar(16)", (col) => col.notNull())
    .addColumn("tenant_id", "integer")
    .addColumn("visibility", "varchar(16)", (col) => col.notNull())
    .addColumn("object_type", "varchar(16)", (col) => col.notNull())
    .addColumn("relative_path", "varchar(500)", (col) => col.notNull())
    .addColumn("disk_path", "varchar(700)", (col) => col.notNull())
    .addColumn("mime_type", "varchar(160)")
    .addColumn("size_bytes", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("checksum", "varchar(64)")
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await database.schema.createIndex("storage_objects_scope_idx").ifNotExists().on("storage_objects").columns(["scope", "tenant_id", "visibility"]).execute();
  await database.schema
    .createIndex("storage_objects_owner_path_idx")
    .ifNotExists()
    .unique()
    .on("storage_objects")
    .columns(["scope", "tenant_id", "visibility", "relative_path"])
    .execute();
}

async function addColumnIfMissing(database: Kysely<PlatformDatabase>, tableName: string, columnName: string, definition: string) {
  const tables = await database.introspection.getTables();
  const table = tables.find((candidate) => candidate.name === tableName);
  if (!table || table.columns.some((column) => column.name === columnName)) {
    return;
  }
  await sql.raw(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`).execute(database);
}
