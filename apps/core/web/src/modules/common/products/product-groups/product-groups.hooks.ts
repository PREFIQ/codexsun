import { useQuery } from "@tanstack/react-query";
import { listProductGroups } from "./product-groups.services";
export function useProductGroupsQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listProductGroups(path), queryKey: ["core", "common", key] });
}
