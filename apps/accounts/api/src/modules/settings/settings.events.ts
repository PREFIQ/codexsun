import type { AccountsSettings } from "./settings.types.js";

export const accountsSettingsEvents = {
  changed: "accounts.settings.changed"
} as const;

export function createAccountsSettingsEvent(
  action: "created" | "updated",
  payload: { settings: AccountsSettings }
) {
  return {
    name: accountsSettingsEvents.changed,
    occurredAt: new Date().toISOString(),
    payload: { action, ...payload },
    version: 1
  };
}
