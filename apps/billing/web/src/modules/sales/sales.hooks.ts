import { useQuery } from "@tanstack/react-query";
import { getSale, listSales } from "./sales.services";

export function useSalesList() {
  return useQuery({
    queryFn: listSales,
    queryKey: ["billing", "sales"]
  });
}

export const useSaleList = useSalesList;

export function useSaleRecord(id: string | null, enabled = true) {
  return useQuery({
    enabled: Boolean(id) && enabled,
    queryFn: () => getSale(id!),
    queryKey: ["billing", "sales", id]
  });
}
