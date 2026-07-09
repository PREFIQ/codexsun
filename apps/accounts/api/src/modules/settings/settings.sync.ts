import type { AccountsSettings } from "./settings.types.js";

export function shouldSyncAccountsSettings(settings: AccountsSettings) {
  return settings.tallyIntegration.enabled || settings.postingRules.postOnBillingSave;
}

export function buildAccountsSettingsSyncSummary(settings: AccountsSettings) {
  return {
    postingMode: settings.postingRules.mode,
    syncEnabled: shouldSyncAccountsSettings(settings),
    tallyMode: settings.tallyIntegration.syncMode
  };
}
