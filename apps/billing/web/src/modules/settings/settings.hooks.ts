import { useQuery } from "@tanstack/react-query";
import { getBillingSettings } from "./settings.services";

export function useBillingSettings() {
  return useQuery({
    queryFn: getBillingSettings,
    queryKey: ["billing", "settings"],
  });
}

export const useSalesSettings = useBillingSettings;
