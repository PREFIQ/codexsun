import type { BillingSalesSettings } from "./settings.types.js";

export const billingSettingsEvents = {
  changed: "billing.settings.changed"
} as const;

export function createBillingSettingsEvent(action: "created" | "updated", payload: { settings: BillingSalesSettings }) {
  return {
    name: billingSettingsEvents.changed,
    occurredAt: new Date().toISOString(),
    payload: { action, ...payload },
    version: 1
  };
}
