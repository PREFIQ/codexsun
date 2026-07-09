import { sql, type Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";

export async function migrateLocationTable(database: Kysely<CoreDatabase>, tableName: string) {
  await sql.raw(`
    CREATE TABLE IF NOT EXISTS \`${tableName}\` (
      id VARCHAR(120) NOT NULL PRIMARY KEY,
      uuid VARCHAR(8) NOT NULL UNIQUE,
      tenant_id VARCHAR(80) NOT NULL DEFAULT 'global',
      code VARCHAR(80) NOT NULL,
      name VARCHAR(180) NOT NULL,
      status VARCHAR(24) NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 1000,
      country_id VARCHAR(120) NULL,
      state_id VARCHAR(120) NULL,
      district_id VARCHAR(120) NULL,
      city_id VARCHAR(120) NULL,
      iso2 VARCHAR(2) NULL,
      iso3 VARCHAR(3) NULL,
      numeric_code VARCHAR(8) NULL,
      dial_code VARCHAR(16) NULL,
      currency_code VARCHAR(8) NULL,
      capital VARCHAR(120) NULL,
      gst_state_code VARCHAR(4) NULL,
      short_code VARCHAR(24) NULL,
      pincode VARCHAR(16) NULL,
      area_name VARCHAR(180) NULL,
      city_name VARCHAR(180) NULL,
      district_name VARCHAR(180) NULL,
      state_name VARCHAR(180) NULL,
      country_name VARCHAR(180) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX ${tableName}_tenant_idx (tenant_id),
      INDEX ${tableName}_country_idx (country_id),
      INDEX ${tableName}_state_idx (state_id),
      INDEX ${tableName}_district_idx (district_id),
      INDEX ${tableName}_city_idx (city_id),
      UNIQUE KEY ${tableName}_tenant_code_unique (tenant_id, code),
      UNIQUE KEY ${tableName}_tenant_name_unique (tenant_id, name)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `).execute(database);

  await ensureLocationColumns(database, tableName);
}

async function ensureLocationColumns(database: Kysely<CoreDatabase>, tableName: string) {
  await addColumnIfMissing(database, tableName, "uuid", "VARCHAR(8) NULL UNIQUE");
  await addColumnIfMissing(database, tableName, "tenant_id", "VARCHAR(80) NOT NULL DEFAULT 'global'");
  await addColumnIfMissing(database, tableName, "code", "VARCHAR(80) NULL");
  await addColumnIfMissing(database, tableName, "sort_order", "INT NOT NULL DEFAULT 1000");
  await addColumnIfMissing(database, tableName, "country_id", "VARCHAR(120) NULL");
  await addColumnIfMissing(database, tableName, "state_id", "VARCHAR(120) NULL");
  await addColumnIfMissing(database, tableName, "district_id", "VARCHAR(120) NULL");
  await addColumnIfMissing(database, tableName, "city_id", "VARCHAR(120) NULL");
  await addColumnIfMissing(database, tableName, "gst_state_code", "VARCHAR(4) NULL");
  await addColumnIfMissing(database, tableName, "short_code", "VARCHAR(24) NULL");
  await addColumnIfMissing(database, tableName, "pincode", "VARCHAR(16) NULL");
  await addColumnIfMissing(database, tableName, "area_name", "VARCHAR(180) NULL");
  await addColumnIfMissing(database, tableName, "city_name", "VARCHAR(180) NULL");
  await addColumnIfMissing(database, tableName, "district_name", "VARCHAR(180) NULL");
  await addColumnIfMissing(database, tableName, "state_name", "VARCHAR(180) NULL");
  await addColumnIfMissing(database, tableName, "country_name", "VARCHAR(180) NULL");
  await addColumnIfMissing(database, tableName, "created_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");
  await addColumnIfMissing(database, tableName, "updated_at", "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

  await sql.raw(`UPDATE \`${tableName}\` SET uuid = LOWER(LEFT(REPLACE(UUID(), '-', ''), 8)) WHERE uuid IS NULL OR uuid = ''`).execute(database);
  await sql.raw(`UPDATE \`${tableName}\` SET tenant_id = 'global' WHERE tenant_id IS NULL OR tenant_id = ''`).execute(database);
  await sql.raw(`UPDATE \`${tableName}\` SET code = id WHERE code IS NULL OR code = ''`).execute(database);
}

async function addColumnIfMissing(database: Kysely<CoreDatabase>, tableName: string, columnName: string, definition: string) {
  const tables = await database.introspection.getTables();
  const table = tables.find((candidate) => candidate.name === tableName);
  if (!table || table.columns.some((column) => column.name === columnName)) return;
  await sql.raw(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`).execute(database);
}
