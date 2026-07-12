import { useQuery } from "@tanstack/react-query";
import { listBankNames } from "./bank-names.services";
export function useBankNamesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listBankNames(path), queryKey: ["core", "common", key] });
}
