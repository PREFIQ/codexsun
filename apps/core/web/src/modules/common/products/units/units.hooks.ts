import { useQuery } from "@tanstack/react-query";
import { listUnits } from "./units.services";
export function useUnitsQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listUnits(path), queryKey: ["core", "common", key] });
}
