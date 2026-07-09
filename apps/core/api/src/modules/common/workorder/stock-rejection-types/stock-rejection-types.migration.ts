import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { stockRejectionTypesDefinition } from "./stock-rejection-types.definition.js";
export function migrateStockRejectionTypes(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, stockRejectionTypesDefinition); }
