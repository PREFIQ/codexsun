import type { Kysely } from "kysely";
import type { CoreDatabase } from "../../database/core-database.js";

export const countryMigration = {
  key: "core.country.initial",
  description: "Initial country master data contract for the Core app."
};

export async function migrateCountryModule(database: Kysely<CoreDatabase>) {
  await database.schema
    .createTable("core_countries")
    .ifNotExists()
    .addColumn("id", "varchar(80)", (col) => col.primaryKey())
    .addColumn("iso2", "varchar(2)", (col) => col.notNull().unique())
    .addColumn("iso3", "varchar(3)", (col) => col.notNull().unique())
    .addColumn("name", "varchar(160)", (col) => col.notNull())
    .addColumn("numeric_code", "varchar(8)", (col) => col.notNull())
    .addColumn("dial_code", "varchar(16)", (col) => col.notNull())
    .addColumn("currency_code", "varchar(8)", (col) => col.notNull())
    .addColumn("capital", "varchar(120)")
    .addColumn("status", "varchar(24)", (col) => col.notNull())
    .execute();
}
