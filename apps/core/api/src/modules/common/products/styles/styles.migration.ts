import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { stylesDefinition } from "./styles.definition.js";
export function migrateStyles(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, stylesDefinition); }
