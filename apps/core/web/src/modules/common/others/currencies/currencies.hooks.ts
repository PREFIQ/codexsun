import { useQuery } from "@tanstack/react-query";
import { listCurrencies } from "./currencies.services";
export function useCurrenciesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listCurrencies(path), queryKey: ["core", "common", key] });
}
