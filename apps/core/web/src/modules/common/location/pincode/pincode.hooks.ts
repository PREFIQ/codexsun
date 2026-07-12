import { useQuery } from "@tanstack/react-query";
import { listPincodeRecords } from "./pincode.services";
export function usePincodeQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listPincodeRecords(path), queryKey: ["core", "location", key] });
}
