import { useQuery } from "@tanstack/react-query";
import { getPurchase, getPurchaseContext, listPurchases } from "./purchase.services";

export function usePurchaseList() {
  return useQuery({
    queryFn: listPurchases,
    queryKey: ["billing", "purchases"]
  });
}

export function usePurchaseRecord(id: string | null, enabled = true) {
  return useQuery({
    enabled: Boolean(id) && enabled,
    queryFn: () => getPurchase(id!),
    queryKey: ["billing", "purchases", id]
  });
}

export function usePurchaseContext() {
  return useQuery({
    queryFn: getPurchaseContext,
    queryKey: ["billing", "purchases", "context"]
  });
}
