import { sql, type Kysely } from "kysely";
import { defaultAccountsSettings } from "./settings.types.js";

export async function seedAccountsSettingsModule(db?: Kysely<any>) {
  if (db) {
    const payload = JSON.stringify(defaultAccountsSettings);
    await sql`
      INSERT INTO accounts_settings (id, settings_json)
      VALUES ('accounts', ${payload})
      ON DUPLICATE KEY UPDATE settings_json = settings_json
    `.execute(db);
  }
  return { seeded: true, settings: defaultAccountsSettings };
}
