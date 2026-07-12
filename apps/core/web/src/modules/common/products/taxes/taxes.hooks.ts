import { useQuery } from "@tanstack/react-query";
import { listTaxes } from "./taxes.services";
export function useTaxesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listTaxes(path), queryKey: ["core", "common", key] });
}
