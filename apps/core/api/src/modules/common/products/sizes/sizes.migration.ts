import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { sizesDefinition } from "./sizes.definition.js";
export function migrateSizes(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, sizesDefinition); }
