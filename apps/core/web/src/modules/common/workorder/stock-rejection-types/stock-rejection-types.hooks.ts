import { useQuery } from "@tanstack/react-query";
import { listStockRejectionTypes } from "./stock-rejection-types.services";
export function useStockRejectionTypesQuery(key: string, path: string) {
  return useQuery({
    queryFn: () => listStockRejectionTypes(path),
    queryKey: ["core", "common", key]
  });
}
