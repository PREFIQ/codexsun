import { useQuery } from "@tanstack/react-query";
import { listPaymentTerms } from "./payment-terms.services";
export function usePaymentTermsQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listPaymentTerms(path), queryKey: ["core", "common", key] });
}
