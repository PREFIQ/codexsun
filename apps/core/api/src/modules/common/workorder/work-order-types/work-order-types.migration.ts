import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { workOrderTypesDefinition } from "./work-order-types.definition.js";
export function migrateWorkOrderTypes(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, workOrderTypesDefinition); }
