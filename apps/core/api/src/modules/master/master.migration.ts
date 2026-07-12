import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../database/core-database.js";
import { migrateContactModule } from "./contact/index.js";
import { migrateProductModule } from "./product/index.js";
import { migrateWorkOrderModule } from "./work-order/index.js";
export async function migrateMasterModule(database: Kysely<CoreDatabase>) {
  await migrateContactModule(database);
  await migrateProductModule(database);
  await migrateWorkOrderModule(database);
}
