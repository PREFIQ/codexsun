import { sql, type Kysely } from "kysely";
import type { CoreDatabase } from "../../../database/core-database.js";
import type { CommonMasterDefinition, CommonMasterField } from "./common-master.types.js";

export async function migrateCommonMaster(database: Kysely<CoreDatabase>, definition: CommonMasterDefinition) {
  const fieldSql = definition.fields.map((field) => `\`${field.column}\` ${columnType(field)} ${field.required ? "NOT NULL" : "NULL"}`).join(",\n");
  await sql.raw(`
    CREATE TABLE IF NOT EXISTS \`${definition.tableName}\` (
      id VARCHAR(160) NOT NULL PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      tenant_id VARCHAR(80) NOT NULL,
      ${fieldSql},
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 1000,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX ${definition.tableName}_tenant_idx (tenant_id)
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `).execute(database);
}

function columnType(field: CommonMasterField) {
  if (field.type === "boolean") return "TINYINT(1)";
  if (field.type === "date") return "DATE";
  if (field.type === "number") return "DOUBLE";
  return "VARCHAR(255)";
}
