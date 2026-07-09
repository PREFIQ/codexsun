import type { Kysely } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import { defaultBillingSalesSettings, type BillingSalesSettings } from "./settings.types.js";

type BillingSettingsRow = {
  created_at: string | null;
  id: string;
  settings_json: string | null;
  updated_at: string | null;
};

type BillingSettingsDatabase = {
  billing_settings: BillingSettingsRow;
};

export class BillingSettingsRepository {
  async getSalesSettings(databaseName: string) {
    const row = await (await database(databaseName))
      .selectFrom("billing_settings")
      .selectAll()
      .where("id", "=", "sales")
      .executeTakeFirst();
    return row ? normalizeSettings(row.settings_json) : defaultBillingSalesSettings;
  }

  async saveSalesSettings(databaseName: string, input: BillingSalesSettings) {
    const db = await database(databaseName);
    const now = new Date().toISOString();
    const payload = JSON.stringify(input);
    await db
      .insertInto("billing_settings")
      .values({
        created_at: now,
        id: "sales",
        settings_json: payload,
        updated_at: now,
      })
      .onDuplicateKeyUpdate({
        settings_json: payload,
        updated_at: now,
      })
      .execute();
    return input;
  }
}

function database(databaseName: string) {
  return getBillingDatabase(databaseName) as unknown as Promise<Kysely<BillingSettingsDatabase>>;
}

function normalizeSettings(value: string | null) {
  if (!value) return defaultBillingSalesSettings;
  try {
    const parsed = JSON.parse(value) as Partial<BillingSalesSettings>;
    return {
      ...defaultBillingSalesSettings,
      ...parsed,
    };
  } catch {
    return defaultBillingSalesSettings;
  }
}
