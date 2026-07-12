import { useQuery } from "@tanstack/react-query";
import { listBrands } from "./brands.services";
export function useBrandsQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listBrands(path), queryKey: ["core", "common", key] });
}
