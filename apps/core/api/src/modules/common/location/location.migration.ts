import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../../database/core-database.js";
import { migrateCityModule } from "./city/city.migration.js";
import { migrateCountryModule } from "./country/country.migration.js";
import { migrateDistrictModule } from "./district/district.migration.js";
import { migratePincodeModule } from "./pincode/pincode.migration.js";
import { migrateStateModule } from "./state/state.migration.js";

export async function migrateLocationModules(database: Kysely<CoreDatabase>) {
  await migrateCountryModule(database);
  await migrateStateModule(database);
  await migrateDistrictModule(database);
  await migrateCityModule(database);
  await migratePincodeModule(database);
}
