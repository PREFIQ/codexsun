import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { warehousesDefinition } from "./warehouses.definition.js";
export function migrateWarehouses(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, warehousesDefinition); }
