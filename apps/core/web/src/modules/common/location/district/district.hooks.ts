import { useQuery } from "@tanstack/react-query";
import { listDistrictRecords } from "./district.services";
export function useDistrictQuery(key: string, path: string) {
  return useQuery({
    queryFn: () => listDistrictRecords(path),
    queryKey: ["core", "location", key]
  });
}
