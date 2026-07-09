import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../../database/core-database.js";
import { migrateCommonMaster } from "../../foundation/common-master.migration.js";
import { paymentTermsDefinition } from "./payment-terms.definition.js";
export function migratePaymentTerms(database: Kysely<CoreDatabase>) { return migrateCommonMaster(database, paymentTermsDefinition); }
