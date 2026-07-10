import { useQuery } from "@tanstack/react-query";
import { getPurchase, listPurchases } from "./purchase.services";

export function usePurchaseList() {
  return useQuery({
    queryFn: listPurchases,
    queryKey: ["billing", "purchase"],
  });
}

export function usePurchaseRecord(id: string | null, enabled = true) {
  return useQuery({
    enabled: Boolean(id) && enabled,
    queryFn: () => getPurchase(id!),
    queryKey: ["billing", "purchase", id],
  });
}
