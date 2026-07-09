import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { brandsDefinition } from "./brands.definition.js";
export function migrateBrands(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, brandsDefinition); }
