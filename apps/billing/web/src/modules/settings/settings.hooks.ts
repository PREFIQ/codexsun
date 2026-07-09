import { useQuery } from "@tanstack/react-query";
import { getSalesSettings } from "./settings.services";

export function useSalesSettings() {
  return useQuery({
    queryFn: getSalesSettings,
    queryKey: ["billing", "settings", "sales"],
  });
}

