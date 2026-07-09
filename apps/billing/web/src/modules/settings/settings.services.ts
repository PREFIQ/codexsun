import { billingApiGet, billingApiPut } from "../../shared/api/billing-api";
import type { BillingSalesSettings } from "./settings.types";

export async function getSalesSettings() {
  return billingApiGet<BillingSalesSettings>("/billing/settings/sales");
}

export async function saveSalesSettings(payload: BillingSalesSettings) {
  return billingApiPut<BillingSalesSettings>("/billing/settings/sales", payload);
}

