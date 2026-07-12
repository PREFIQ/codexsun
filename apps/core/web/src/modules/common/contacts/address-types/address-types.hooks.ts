import { useQuery } from "@tanstack/react-query";
import { listAddressTypes } from "./address-types.services";
export function useAddressTypesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listAddressTypes(path), queryKey: ["core", "common", key] });
}
