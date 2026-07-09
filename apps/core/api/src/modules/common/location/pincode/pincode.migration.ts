import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { pincodeLocationDefinition } from "../location.definitions.js";
import { migrateLocationTable } from "../shared/location.migration.js";

export const pincodeMigration = {
  description: "Independent pincode reference records with readable location labels.",
  key: "core.common.location.pincode"
};

export function migratePincodeModule(database: Kysely<CoreDatabase>) {
  return migrateLocationTable(database, pincodeLocationDefinition.tableName);
}

