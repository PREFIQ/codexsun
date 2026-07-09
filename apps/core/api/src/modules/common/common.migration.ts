import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../database/core-database.js";
import { migrateLocationModules } from "./location/location.migration.js";
import { commonMasterDefinitions } from "./common-master.registry.js";
import { migrateCommonMaster } from "./foundation/common-master.migration.js";

export const commonMigration = {
  description: "Common module aggregator migrations.",
  key: "core.common"
};

export async function migrateCommonModule(database: Kysely<CoreDatabase>) {
  await migrateLocationModules(database);
  for (const definition of commonMasterDefinitions) {
    await migrateCommonMaster(database, definition);
  }
}
