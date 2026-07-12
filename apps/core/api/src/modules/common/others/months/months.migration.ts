import type { Kysely } from "kysely";
import { sql } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";

export const monthsMigration = {
  description: "Months master data.",
  key: "core.common.others.months"
};

export function migrateMonths(database: Kysely<CoreDatabase>) {
  return sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS months (
      id VARCHAR(160) NOT NULL PRIMARY KEY,
      uuid CHAR(8) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      from_date DATE NOT NULL,
      to_date DATE NOT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      sort_order INT NOT NULL DEFAULT 1000,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY months_name_unique (name),
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `
    )
    .execute(database);
}
