import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { taxesDefinition } from "./taxes.definition.js";
export function migrateTaxes(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, taxesDefinition); }
