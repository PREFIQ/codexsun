import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { cityLocationDefinition } from "../location.definitions.js";
import { migrateLocationTable } from "../shared/location.migration.js";

export const cityMigration = {
  description: "City master data related to district, state, and country.",
  key: "core.common.location.city"
};

export function migrateCityModule(database: Kysely<CoreDatabase>) {
  return migrateLocationTable(database, cityLocationDefinition.tableName);
}

