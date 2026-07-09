import type { Kysely } from "kysely";
import { getBillingDatabase } from "../../database/billing-database.js";
import { defaultBillingSettings, defaultBillingSalesSettings, type BillingDocumentKind, type BillingDocumentLayoutSettings, type BillingGstApiMode, type BillingSettings } from "./settings.types.js";

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
    const parsed = JSON.parse(value) as Omit<Partial<BillingSettings>, "layout"> &
      Partial<BillingDocumentLayoutSettings> & {
        featureQuotation?: boolean;
        layout?: Partial<BillingDocumentLayoutSettings> | Partial<Record<BillingDocumentKind, Partial<BillingDocumentLayoutSettings>>>;
      };
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
        exportSales: parsed.features?.exportSales ?? defaultBillingSettings.features.exportSales,
        quotation: typeof parsed.featureQuotation === "boolean"
          ? parsed.featureQuotation
          : parsed.features?.quotation ?? defaultBillingSettings.features.quotation,
        tconnect: parsed.features?.tconnect ?? defaultBillingSettings.features.tconnect,
      },
      gstApiMode,
      layout: normalizeSavedLayout(parsed.layout, normalizedLegacyLayout),
      numbering: normalizeNumbering(parsed.numbering),
      customise: {
        documentTitles: {
          ...defaultBillingSettings.customise.documentTitles,
          ...(parsed.customise?.documentTitles ?? {}),
        },
        printLanguage: "english",
      },
      printing: {
        ...defaultBillingSettings.printing,
        ...(parsed.printing ?? {}),
        letterhead: {
          ...defaultBillingSettings.printing.letterhead,
          ...(parsed.printing?.letterhead ?? {}),
        },
      },
    };
  } catch {
    return defaultBillingSalesSettings;
  }
}

function normalizeNumbering(value: Partial<BillingSettings["numbering"]> | undefined): BillingSettings["numbering"] {
  return {
    exportSales: { ...defaultBillingSettings.numbering.exportSales, ...(value?.exportSales ?? {}) },
    purchase: { ...defaultBillingSettings.numbering.purchase, ...(value?.purchase ?? {}) },
    quotation: { ...defaultBillingSettings.numbering.quotation, ...(value?.quotation ?? {}) },
    sales: { ...defaultBillingSettings.numbering.sales, ...(value?.sales ?? {}) },
  };
}

function normalizeLayout(value: Partial<BillingDocumentLayoutSettings> | undefined): BillingDocumentLayoutSettings {
  return {
    ...defaultBillingSettings.layout,
    ...(value ?? {}),
  };
}

function normalizeSavedLayout(
  value: Partial<BillingDocumentLayoutSettings> | Partial<Record<BillingDocumentKind, Partial<BillingDocumentLayoutSettings>>> | undefined,
  legacyLayout: BillingDocumentLayoutSettings | undefined
) {
  if (!value) return normalizeLayout(legacyLayout);
  if ("usePo" in value || "useDc" in value || "useColour" in value) {
    return normalizeLayout(value as Partial<BillingDocumentLayoutSettings>);
  }
  const documentLayouts = value as Partial<Record<BillingDocumentKind, Partial<BillingDocumentLayoutSettings>>>;
  return normalizeLayout(documentLayouts.sales ?? documentLayouts.quotation ?? documentLayouts.purchase ?? legacyLayout);
}
