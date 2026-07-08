import { billingApiGet } from "../../shared/api/billing-api";
import type { Sale } from "./sales.types";

export function listSales() {
  return billingApiGet<Sale[]>("/billing/sales");
}
