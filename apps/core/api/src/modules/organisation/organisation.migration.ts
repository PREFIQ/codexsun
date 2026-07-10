import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../database/core-database.js";
import { migrateCompanyModule } from "./company/company.migration.js";

export async function migrateOrganisationModule(database: Kysely<CoreDatabase>) {
  await migrateCompanyModule(database);
}
