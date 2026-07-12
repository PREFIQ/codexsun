import { useQuery } from "@tanstack/react-query";
import { listWorkOrderTypes } from "./work-order-types.services";
export function useWorkOrderTypesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listWorkOrderTypes(path), queryKey: ["core", "common", key] });
}
