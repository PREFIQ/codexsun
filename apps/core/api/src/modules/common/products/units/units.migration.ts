import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { unitsDefinition } from "./units.definition.js";
export function migrateUnits(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, unitsDefinition); }
