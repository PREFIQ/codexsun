import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { transportsDefinition } from "./transports.definition.js";
export function migrateTransports(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, transportsDefinition); }
