import { sql, type Kysely } from "kysely";

export async function migrateBillingSettingsModule(database: Kysely<any>) {
  await sql
    .raw(
      `
    CREATE TABLE IF NOT EXISTS billing_settings (
      id varchar(40) primary key,
      settings_json longtext null,
      created_at varchar(40) null,
      updated_at varchar(40) null
    )
  `
    )
    .execute(database);
}
