import { useQuery } from "@tanstack/react-query";
import { listWarehouses } from "./warehouses.services";
export function useWarehousesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listWarehouses(path), queryKey: ["core", "common", key] });
}
