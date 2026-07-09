import { sql, type Kysely } from "kysely";

export async function migrateAccountsSettingsModule(db: Kysely<any>) {
  await db.schema
    .createTable("accounts_settings")
    .ifNotExists()
    .addColumn("id", "varchar(40)", (col) => col.primaryKey())
    .addColumn("settings_json", "text", (col) => col.notNull())
    .addColumn("created_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn("updated_at", "datetime", (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();
}
