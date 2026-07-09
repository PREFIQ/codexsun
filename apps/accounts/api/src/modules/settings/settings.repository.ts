import { sql } from "kysely";
import { getAccountsDatabase } from "../../database/accounts-database.js";
import { defaultAccountsSettings, type AccountsSettings } from "./settings.types.js";

type SettingsRow = {
  settings_json: string;
};

export class AccountsSettingsRepository {
  async get(databaseName: string) {
    const db = await getAccountsDatabase(databaseName);
    const result = await sql<SettingsRow>`SELECT settings_json FROM accounts_settings WHERE id = 'accounts' LIMIT 1`.execute(db);
    return result.rows[0] ? normalizeSettings(result.rows[0].settings_json) : defaultAccountsSettings;
  }

  async save(databaseName: string, settings: AccountsSettings) {
    const db = await getAccountsDatabase(databaseName);
    const normalized = normalizeSettings(JSON.stringify(settings));
    const payload = JSON.stringify(normalized);
    await sql`
      INSERT INTO accounts_settings (id, settings_json)
      VALUES ('accounts', ${payload})
      ON DUPLICATE KEY UPDATE settings_json = ${payload}, updated_at = CURRENT_TIMESTAMP
    `.execute(db);
    return normalized;
  }
}

function normalizeSettings(value: string): AccountsSettings {
  try {
    const parsed = JSON.parse(value) as Partial<AccountsSettings>;
    return {
      financialYear: { ...defaultAccountsSettings.financialYear, ...parsed.financialYear },
      postingRules: { ...defaultAccountsSettings.postingRules, ...parsed.postingRules },
      tallyIntegration: { ...defaultAccountsSettings.tallyIntegration, ...parsed.tallyIntegration },
      voucherNumbering: { ...defaultAccountsSettings.voucherNumbering, ...parsed.voucherNumbering }
    };
  } catch {
    return defaultAccountsSettings;
  }
}
