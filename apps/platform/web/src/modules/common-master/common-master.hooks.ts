import { useQuery } from "@tanstack/react-query";
import { listCommonMaster } from "./common-master.services";
export function useCommonMasterQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listCommonMaster(path), queryKey: ["core", "common", key] });
}
