import { useQuery } from "@tanstack/react-query";
import { getExportSale, listExportSales } from "./export-sales.services";

export function useExportSalesList() {
  return useQuery({
    queryFn: listExportSales,
    queryKey: ["billing", "export-sales"],
  });
}

export function useExportSaleRecord(id: string | null, enabled = true) {
  return useQuery({
    enabled: Boolean(id) && enabled,
    queryFn: () => getExportSale(id!),
    queryKey: ["billing", "export-sales", id],
  });
}
