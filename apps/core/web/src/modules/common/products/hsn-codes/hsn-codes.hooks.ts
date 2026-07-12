import { useQuery } from "@tanstack/react-query";
import { listHsnCodes } from "./hsn-codes.services";
export function useHsnCodesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listHsnCodes(path), queryKey: ["core", "common", key] });
}
