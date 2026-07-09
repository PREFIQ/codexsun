import type { BillingSalesSettings } from "./settings.types.js";

export function shouldSyncBillingSettings(settings: BillingSalesSettings) {
  return settings.useEway || settings.useEinvoice || settings.featureQuotation;
}

export function buildBillingSettingsSyncSummary(settings: BillingSalesSettings) {
  return {
    enabled: shouldSyncBillingSettings(settings),
    gstApiMode: settings.gstApiMode
  };
}
