import { sql, type Generated, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { getBillingDatabase } from "../../database/billing-database.js";
import {
  defaultBillingSettings,
  defaultBillingSalesSettings,
  type BillingDocumentKind,
  type BillingDocumentLayoutSettings,
  type BillingGstApiMode,
  type BillingSettings
} from "./settings.types.js";

type BillingSettingsRow = {
  created_at: string | null;
  id: string;
  settings_json: string | null;
  updated_at: string | null;
};

type BillingSettingsDatabase = {
  billing_settings: BillingSettingsRow;
  billing_company_settings: {
    company_id: number;
    created_at: Generated<string>;
    id: Generated<number>;
    settings_json: string | null;
    settings_key: string;
    updated_at: Generated<string>;
    uuid: string;
  };
};

export class BillingSettingsRepository {
  async getBillingSettings(databaseName: string, companyId: number) {
    await this.assertCompany(databaseName, companyId);
    const companyRow = await (
      await database(databaseName)
    )
      .selectFrom("billing_company_settings")
      .selectAll()
      .where("company_id", "=", companyId)
      .where("settings_key", "=", "billing")
      .executeTakeFirst();
    if (companyRow) return normalizeSettings(companyRow.settings_json);

    const row = await (
      await database(databaseName)
    )
      .selectFrom("billing_settings")
      .selectAll()
      .where("id", "=", "billing")
      .executeTakeFirst();
    const settings = row ? normalizeSettings(row.settings_json) : defaultBillingSettings;
    return this.saveBillingSettings(databaseName, companyId, settings);
  }

  async saveBillingSettings(databaseName: string, companyId: number, input: BillingSettings) {
    await this.assertCompany(databaseName, companyId);
    const db = await database(databaseName);
    const settings = normalizeSettings(JSON.stringify(input));
    const payload = JSON.stringify(settings);
    await db
      .insertInto("billing_company_settings")
      .values({
        company_id: companyId,
        settings_json: payload,
        settings_key: "billing",
        uuid: publicUuid()
      })
      .onDuplicateKeyUpdate({
        settings_json: payload,
        updated_at: sql`CURRENT_TIMESTAMP(3)`
      })
      .execute();
    return settings;
  }

  async getSalesSettings(databaseName: string, companyId: number) {
    return this.getBillingSettings(databaseName, companyId);
  }

  async saveSalesSettings(databaseName: string, companyId: number, input: BillingSettings) {
    return this.saveBillingSettings(databaseName, companyId, input);
  }

  async defaultCompanyId(databaseName: string) {
    const result = await sql<{ company_id: number }>`
      SELECT company_id FROM default_company_settings
      WHERE singleton_key = 1 AND status = 'active'
      LIMIT 1
    `.execute(await database(databaseName));
    const companyId = Number(result.rows[0]?.company_id ?? 0);
    if (!companyId)
      throw AppError.conflict("An active Default Company is required for Billing settings.");
    return companyId;
  }

  private async assertCompany(databaseName: string, companyId: number) {
    if (!Number.isInteger(companyId) || companyId <= 0) {
      throw AppError.validation("x-company-id is required for Billing settings.");
    }
    const result = await sql<{ id: number }>`
      SELECT id FROM companies WHERE id = ${companyId} AND status = 'active' LIMIT 1
    `.execute(await database(databaseName));
    if (!result.rows[0])
      throw AppError.validation("The selected company is not active or does not exist.");
  }
}

function publicUuid() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 8);
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
        layout?:
          | Partial<BillingDocumentLayoutSettings>
          | Partial<Record<BillingDocumentKind, Partial<BillingDocumentLayoutSettings>>>;
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
    const savedLayout = normalizeSavedLayout(parsed.layout, normalizedLegacyLayout);
    const gstApiMode: BillingGstApiMode =
      parsed.gstApiMode === "none" ||
      parsed.gstApiMode === "eway_only" ||
      parsed.gstApiMode === "einvoice_eway"
        ? parsed.gstApiMode
        : !savedLayout.useEway
          ? "none"
          : savedLayout.useEinvoice
            ? "einvoice_eway"
            : "eway_only";
    return {
      ...defaultBillingSettings,
      features: {
        exportSales: parsed.features?.exportSales ?? defaultBillingSettings.features.exportSales,
        quotation:
          typeof parsed.featureQuotation === "boolean"
            ? parsed.featureQuotation
            : (parsed.features?.quotation ?? defaultBillingSettings.features.quotation),
        tconnect: parsed.features?.tconnect ?? defaultBillingSettings.features.tconnect
      },
      gstApiMode,
      layout: {
        ...savedLayout,
        useEinvoice: gstApiMode === "einvoice_eway",
        useEway: gstApiMode !== "none"
      },
      numbering: normalizeNumbering(parsed.numbering),
      customise: {
        documentTitles: {
          ...defaultBillingSettings.customise.documentTitles,
          ...(parsed.customise?.documentTitles ?? {})
        },
        printLanguage: "english"
      },
      printing: {
        ...defaultBillingSettings.printing,
        ...(parsed.printing ?? {}),
        letterhead: {
          ...defaultBillingSettings.printing.letterhead,
          ...(parsed.printing?.letterhead ?? {})
        }
      }
    };
  } catch {
    return defaultBillingSalesSettings;
  }
}

function normalizeNumbering(
  value: Partial<BillingSettings["numbering"]> | undefined
): BillingSettings["numbering"] {
  return {
    exportSales: { ...defaultBillingSettings.numbering.exportSales, ...(value?.exportSales ?? {}) },
    payment: { ...defaultBillingSettings.numbering.payment, ...(value?.payment ?? {}) },
    purchase: { ...defaultBillingSettings.numbering.purchase, ...(value?.purchase ?? {}) },
    quotation: { ...defaultBillingSettings.numbering.quotation, ...(value?.quotation ?? {}) },
    receipt: { ...defaultBillingSettings.numbering.receipt, ...(value?.receipt ?? {}) },
    sales: { ...defaultBillingSettings.numbering.sales, ...(value?.sales ?? {}) }
  };
}

function normalizeLayout(
  value: Partial<BillingDocumentLayoutSettings> | undefined
): BillingDocumentLayoutSettings {
  return {
    ...defaultBillingSettings.layout,
    ...(value ?? {})
  };
}

function normalizeSavedLayout(
  value:
    | Partial<BillingDocumentLayoutSettings>
    | Partial<Record<BillingDocumentKind, Partial<BillingDocumentLayoutSettings>>>
    | undefined,
  legacyLayout: BillingDocumentLayoutSettings | undefined
) {
  if (!value) return normalizeLayout(legacyLayout);
  if ("usePo" in value || "useDc" in value || "useColour" in value) {
    return normalizeLayout(value as Partial<BillingDocumentLayoutSettings>);
  }
  const documentLayouts = value as Partial<
    Record<BillingDocumentKind, Partial<BillingDocumentLayoutSettings>>
  >;
  return normalizeLayout(
    documentLayouts.sales ?? documentLayouts.quotation ?? documentLayouts.purchase ?? legacyLayout
  );
}
