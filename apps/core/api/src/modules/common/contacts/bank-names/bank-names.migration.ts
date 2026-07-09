import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { bankNamesDefinition } from "./bank-names.definition.js";
export function migrateBankNames(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, bankNamesDefinition); }
