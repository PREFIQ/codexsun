import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { productTypesDefinition } from "./product-types.definition.js";
export function migrateProductTypes(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, productTypesDefinition); }
