import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../database/core-database.js";
import { migrateCompanyModule } from "./company/company.migration.js";
import { migrateDefaultCompanyModule } from "./default-company/default-company.migration.js";
import { migrateFinancialYearModule } from "./financial-year/financial-year.migration.js";

export async function migrateOrganisationModule(database: Kysely<CoreDatabase>) {
  await migrateCompanyModule(database);
  await migrateFinancialYearModule(database);
  await migrateDefaultCompanyModule(database);
}
