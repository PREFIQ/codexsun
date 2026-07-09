import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { stateLocationDefinition } from "../location.definitions.js";
import { migrateLocationTable } from "../shared/location.migration.js";

export const stateMigration = {
  description: "State master data with GST state codes.",
  key: "core.common.location.state"
};

export function migrateStateModule(database: Kysely<CoreDatabase>) {
  return migrateLocationTable(database, stateLocationDefinition.tableName);
}

