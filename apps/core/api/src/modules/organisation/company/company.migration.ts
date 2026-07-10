import { type Kysely } from "kysely";
import type { CoreDatabase } from "../../../database/core-database.js";
import { migrateMasterTable } from "../../master/master.migration.js";
import { companyDefinition } from "./company.definition.js";

export async function migrateCompanyModule(database: Kysely<CoreDatabase>) {
  await migrateMasterTable(database, companyDefinition.tableName);
}
