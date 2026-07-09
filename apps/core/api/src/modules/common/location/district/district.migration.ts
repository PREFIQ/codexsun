import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { districtLocationDefinition } from "../location.definitions.js";
import { migrateLocationTable } from "../shared/location.migration.js";

export const districtMigration = {
  description: "District master data related to state and country.",
  key: "core.common.location.district"
};

export function migrateDistrictModule(database: Kysely<CoreDatabase>) {
  return migrateLocationTable(database, districtLocationDefinition.tableName);
}

