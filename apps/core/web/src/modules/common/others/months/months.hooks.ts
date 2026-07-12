import { useQuery } from "@tanstack/react-query";
import { listMonths } from "./months.services";
export function useMonthsQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listMonths(path), queryKey: ["core", "common", key] });
}
