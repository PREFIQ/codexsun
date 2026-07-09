import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { contactGroupsDefinition } from "./contact-groups.definition.js";
export function migrateContactGroups(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, contactGroupsDefinition); }
