import { useQuery } from "@tanstack/react-query";
import { getExportSale, getExportSaleContext, listExportSales } from "./export-sales.services";

export function useExportSalesList() {
  return useQuery({
    queryFn: listExportSales,
    queryKey: ["billing", "exportSales"]
  });
}

export const useExportSaleList = useExportSalesList;

export function useExportSaleRecord(id: string | null, enabled = true) {
  return useQuery({
    enabled: Boolean(id) && enabled,
    queryFn: () => getExportSale(id!),
    queryKey: ["billing", "exportSales", id]
  });
}

export function useExportSaleContext() {
  return useQuery({
    queryFn: getExportSaleContext,
    queryKey: ["billing", "exportSales", "context"]
  });
}
