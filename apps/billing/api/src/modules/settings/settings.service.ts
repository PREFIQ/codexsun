import { BillingSettingsRepository } from "./settings.repository.js";
import { defaultBillingSalesSettings, type BillingSalesSettings } from "./settings.types.js";

export class BillingSettingsService {
  constructor(private readonly repository = new BillingSettingsRepository()) {}

  getSalesSettings(databaseName: string) {
    return this.repository.getSalesSettings(databaseName);
  }

  saveSalesSettings(databaseName: string, input: BillingSalesSettings) {
    return this.repository.saveSalesSettings(databaseName, normalizeSalesSettings(input));
  }
}

function normalizeSalesSettings(input: BillingSalesSettings): BillingSalesSettings {
  return {
    ...defaultBillingSalesSettings,
    ...input,
    gstApiMode: input.gstApiMode === "eway_only" ? "eway_only" : "einvoice_eway"
  };
}
