import type { Kysely } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import { defaultBillingSettings, defaultBillingSalesSettings, type BillingDocumentLayoutSettings, type BillingGstApiMode, type BillingSettings } from "./settings.types.js";

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
  async getBillingSettings(databaseName: string) {
    const row = await (await database(databaseName))
      .selectFrom("billing_settings")
      .selectAll()
      .where("id", "=", "billing")
      .executeTakeFirst();
    const settings = row ? normalizeSettings(row.settings_json) : defaultBillingSettings;
    if (!row) {
      await this.saveBillingSettings(databaseName, settings);
    }
    return settings;
  }

  async saveBillingSettings(databaseName: string, input: BillingSettings) {
    const db = await database(databaseName);
    const now = new Date().toISOString();
    const settings = normalizeSettings(JSON.stringify(input));
    const payload = JSON.stringify(settings);
    await db
      .insertInto("billing_settings")
      .values({
        created_at: now,
        id: "billing",
        settings_json: payload,
        updated_at: now,
      })
      .onDuplicateKeyUpdate({
        settings_json: payload,
        updated_at: now,
      })
      .execute();
    return settings;
  }

  async getSalesSettings(databaseName: string) {
    return this.getBillingSettings(databaseName);
  }

  async saveSalesSettings(databaseName: string, input: BillingSettings) {
    return this.saveBillingSettings(databaseName, input);
  }
}

function database(databaseName: string) {
  return getBillingDatabase(databaseName) as unknown as Promise<Kysely<BillingSettingsDatabase>>;
}

function normalizeSettings(value: string | null): BillingSettings {
  if (!value) return defaultBillingSalesSettings;
  try {
    const parsed = JSON.parse(value) as Partial<BillingSettings> & Partial<BillingDocumentLayoutSettings> & { featureQuotation?: boolean };
    const legacyLayout: Partial<BillingDocumentLayoutSettings> = {};
    if (typeof parsed.useColour === "boolean") legacyLayout.useColour = parsed.useColour;
    if (typeof parsed.useDc === "boolean") legacyLayout.useDc = parsed.useDc;
    if (typeof parsed.useEinvoice === "boolean") legacyLayout.useEinvoice = parsed.useEinvoice;
    if (typeof parsed.useEway === "boolean") legacyLayout.useEway = parsed.useEway;
    if (typeof parsed.usePo === "boolean") legacyLayout.usePo = parsed.usePo;
    if (typeof parsed.useSize === "boolean") legacyLayout.useSize = parsed.useSize;
    const hasLegacyLayout = Object.values(legacyLayout).some((value) => typeof value === "boolean");
    const normalizedLegacyLayout = hasLegacyLayout ? normalizeLayout(legacyLayout) : undefined;
    const gstApiMode: BillingGstApiMode = parsed.gstApiMode === "eway_only" ? "eway_only" : "einvoice_eway";
    return {
      ...defaultBillingSettings,
      features: {
        ...defaultBillingSettings.features,
        ...(parsed.features ?? {}),
        ...(typeof parsed.featureQuotation === "boolean" ? { quotation: parsed.featureQuotation } : {}),
      },
      gstApiMode,
      layout: {
        purchase: normalizeLayout(parsed.layout?.purchase ?? normalizedLegacyLayout),
        quotation: normalizeLayout(parsed.layout?.quotation ?? normalizedLegacyLayout),
        sales: normalizeLayout(parsed.layout?.sales ?? normalizedLegacyLayout),
      },
    };
  } catch {
    return defaultBillingSalesSettings;
  }
}

function normalizeLayout(value: Partial<BillingDocumentLayoutSettings> | undefined): BillingDocumentLayoutSettings {
  return {
    ...defaultBillingSettings.layout.sales,
    ...(value ?? {}),
  };
}
