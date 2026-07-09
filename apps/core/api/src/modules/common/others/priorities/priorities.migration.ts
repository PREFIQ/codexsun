import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { prioritiesDefinition } from "./priorities.definition.js";
export function migratePriorities(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, prioritiesDefinition); }
