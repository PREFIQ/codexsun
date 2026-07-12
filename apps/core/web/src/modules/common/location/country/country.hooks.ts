import { useQuery } from "@tanstack/react-query";
import { listCountryRecords } from "./country.services";
export function useCountryQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listCountryRecords(path), queryKey: ["core", "location", key] });
}
