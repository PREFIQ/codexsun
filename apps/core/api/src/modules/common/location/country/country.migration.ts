import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { countryLocationDefinition } from "../location.definitions.js";
import { migrateLocationTable } from "../shared/location.migration.js";

export const countryMigration = {
  description: "Country master data with tenant-aware global defaults.",
  key: "core.common.location.country"
};

export function migrateCountryModule(database: Kysely<CoreDatabase>) {
  return migrateLocationTable(database, countryLocationDefinition.tableName);
}

