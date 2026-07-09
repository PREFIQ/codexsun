import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { addressTypesDefinition } from "./address-types.definition.js";
export function migrateAddressTypes(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, addressTypesDefinition); }
