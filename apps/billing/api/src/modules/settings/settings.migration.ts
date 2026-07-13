import { sql, type Kysely } from "kysely";

export const billingSettingsMigration = {
  description: "Tenant-owned Billing document and numbering settings.",
  key: "billing.settings.foundation-v1"
} as const;

export async function migrateBillingSettingsModule<Database>(database: Kysely<Database>) {
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
