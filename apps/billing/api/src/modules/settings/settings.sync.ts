import type { BillingSettings } from "./settings.types.js";

export function shouldSyncBillingSettings(settings: BillingSettings) {
  return Object.values(settings.layout).some((layout) => layout.useEway || layout.useEinvoice) || settings.features.quotation;
}

export function buildBillingSettingsSyncSummary(settings: BillingSettings) {
  return {
    enabled: shouldSyncBillingSettings(settings),
    gstApiMode: settings.gstApiMode
  };
}
