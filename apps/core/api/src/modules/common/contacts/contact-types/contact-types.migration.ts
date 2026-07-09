import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { contactTypesDefinition } from "./contact-types.definition.js";
export function migrateContactTypes(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, contactTypesDefinition); }
