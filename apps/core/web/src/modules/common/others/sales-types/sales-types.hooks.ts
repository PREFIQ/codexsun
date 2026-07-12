import { useQuery } from "@tanstack/react-query";
import { listSalesTypes } from "./sales-types.services";
export function useSalesTypesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listSalesTypes(path), queryKey: ["core", "common", key] });
}
