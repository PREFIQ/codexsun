import { useQuery } from "@tanstack/react-query";
import { listProductTypes } from "./product-types.services";
export function useProductTypesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listProductTypes(path), queryKey: ["core", "common", key] });
}
