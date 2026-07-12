import { useQuery } from "@tanstack/react-query";
import { listCityRecords } from "./city.services";
export function useCityQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listCityRecords(path), queryKey: ["core", "location", key] });
}
