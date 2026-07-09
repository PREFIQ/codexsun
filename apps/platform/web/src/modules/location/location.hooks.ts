import { useQuery } from "@tanstack/react-query";
import { listLocationRecords } from "./location.services";
export function useLocationQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listLocationRecords(path), queryKey: ["core", "location", key] });
}
