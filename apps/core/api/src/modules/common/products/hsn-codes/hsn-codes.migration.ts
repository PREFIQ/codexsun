import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { hsnCodesDefinition } from "./hsn-codes.definition.js";
export function migrateHsnCodes(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, hsnCodesDefinition); }
