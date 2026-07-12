import { useQuery } from "@tanstack/react-query";
import { listStateRecords } from "./state.services";
export function useStateQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listStateRecords(path), queryKey: ["core", "location", key] });
}
