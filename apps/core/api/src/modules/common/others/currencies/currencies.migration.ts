import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { currenciesDefinition } from "./currencies.definition.js";
export function migrateCurrencies(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, currenciesDefinition); }
