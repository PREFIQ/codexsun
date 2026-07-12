import { useQuery } from "@tanstack/react-query";
import { listTransports } from "./transports.services";
export function useTransportsQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listTransports(path), queryKey: ["core", "common", key] });
}
