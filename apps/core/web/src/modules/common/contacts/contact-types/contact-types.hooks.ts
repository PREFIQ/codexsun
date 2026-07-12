import { useQuery } from "@tanstack/react-query";
import { listContactTypes } from "./contact-types.services";
export function useContactTypesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listContactTypes(path), queryKey: ["core", "common", key] });
}
