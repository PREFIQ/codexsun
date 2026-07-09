import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { destinationsDefinition } from "./destinations.definition.js";
export function migrateDestinations(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, destinationsDefinition); }
