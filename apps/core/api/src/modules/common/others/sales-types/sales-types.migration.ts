import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { salesTypesDefinition } from "./sales-types.definition.js";
export function migrateSalesTypes(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, salesTypesDefinition); }
