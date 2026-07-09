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
    features: { ...defaultBillingSettings.features, ...(input.features ?? {}) },
    gstApiMode: input.gstApiMode === "eway_only" ? "eway_only" : "einvoice_eway"
  };
}
