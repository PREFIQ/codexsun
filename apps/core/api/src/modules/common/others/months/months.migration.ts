import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { monthsDefinition } from "./months.definition.js";
export function migrateMonths(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, monthsDefinition); }
