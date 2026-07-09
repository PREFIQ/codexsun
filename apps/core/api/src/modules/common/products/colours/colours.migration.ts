import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { coloursDefinition } from "./colours.definition.js";
export function migrateColours(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, coloursDefinition); }
