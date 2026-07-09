import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { productCategoriesDefinition } from "./product-categories.definition.js";
export function migrateProductCategories(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, productCategoriesDefinition); }
