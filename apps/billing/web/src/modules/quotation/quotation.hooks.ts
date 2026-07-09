import { useQuery } from "@tanstack/react-query";
import { getQuotation, listQuotations } from "./quotation.services";

export function useQuotationList() {
  return useQuery({
    queryFn: listQuotations,
    queryKey: ["billing", "quotations"],
  });
}

export function useQuotationRecord(id: string | null, enabled = true) {
  return useQuery({
    enabled: Boolean(id) && enabled,
    queryFn: () => getQuotation(id!),
    queryKey: ["billing", "quotations", id],
  });
}

