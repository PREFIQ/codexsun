import { BillingSettingsRepository } from "./settings.repository.js";
import { defaultBillingSettings, type BillingSettings } from "./settings.types.js";

export class BillingSettingsService {
  constructor(private readonly repository = new BillingSettingsRepository()) {}

  getBillingSettings(databaseName: string) {
    return this.repository.getBillingSettings(databaseName);
  }

  saveBillingSettings(databaseName: string, input: BillingSettings) {
    return this.repository.saveBillingSettings(databaseName, normalizeBillingSettings(input));
  }

  getSalesSettings(databaseName: string) {
    return this.getBillingSettings(databaseName);
  }

  saveSalesSettings(databaseName: string, input: BillingSettings) {
    return this.saveBillingSettings(databaseName, input);
  }
}

function normalizeBillingSettings(input: BillingSettings): BillingSettings {
  return {
    ...defaultBillingSettings,
    ...input,
    features: {
      exportSales: input.features?.exportSales ?? defaultBillingSettings.features.exportSales,
      quotation: input.features?.quotation ?? defaultBillingSettings.features.quotation,
      tconnect: input.features?.tconnect ?? defaultBillingSettings.features.tconnect
    },
    gstApiMode: input.gstApiMode === "eway_only" ? "eway_only" : "einvoice_eway",
    layout: { ...defaultBillingSettings.layout, ...(input.layout ?? {}) },
    numbering: {
      exportSales: { ...defaultBillingSettings.numbering.exportSales, ...(input.numbering?.exportSales ?? {}) },
      purchase: { ...defaultBillingSettings.numbering.purchase, ...(input.numbering?.purchase ?? {}) },
      quotation: { ...defaultBillingSettings.numbering.quotation, ...(input.numbering?.quotation ?? {}) },
      sales: { ...defaultBillingSettings.numbering.sales, ...(input.numbering?.sales ?? {}) }
    },
    customise: {
      documentTitles: {
        ...defaultBillingSettings.customise.documentTitles,
        ...(input.customise?.documentTitles ?? {})
      },
      printLanguage: "english"
    },
    printing: {
      ...defaultBillingSettings.printing,
      ...(input.printing ?? {}),
      letterhead: {
        ...defaultBillingSettings.printing.letterhead,
        ...(input.printing?.letterhead ?? {})
      }
    }
  };
}
