import { useQuery } from "@tanstack/react-query";
import { getBillingSettings } from "./billing-settings.services";

export function useBillingSettingsQuery() {
  return useQuery({ queryFn: getBillingSettings, queryKey: ["billing", "settings"] });
}
