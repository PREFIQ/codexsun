import { billingApiGet, billingApiPut } from "../../shared/api/billing-api";
import type { BillingSettings } from "./settings.types";

export async function getBillingSettings() {
  return billingApiGet<BillingSettings>("/billing/settings");
}

export async function saveBillingSettings(payload: BillingSettings) {
  return billingApiPut<BillingSettings>("/billing/settings", payload);
}

export const getSalesSettings = getBillingSettings;
export const saveSalesSettings = saveBillingSettings;
