import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { productGroupsDefinition } from "./product-groups.definition.js";
export function migrateProductGroups(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, productGroupsDefinition); }
