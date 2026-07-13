import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../database/core-database.js";
import { migrateCompanyModule } from "./company/company.migration.js";
import { migrateDefaultCompanyModule } from "./default-company/default-company.migration.js";
import { migrateFinancialYearModule } from "./financial-year/financial-year.migration.js";

export const organisationMigration = {
  description: "Organisation company, financial-year, and default-company foundation.",
  key: "core.organisation.foundation-v1"
} as const;

export async function migrateOrganisationModule(database: Kysely<CoreDatabase>) {
  await migrateCompanyModule(database);
  await migrateFinancialYearModule(database);
  await migrateDefaultCompanyModule(database);
}
