import { useQuery } from "@tanstack/react-query";
import { listPriorities } from "./priorities.services";
export function usePrioritiesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listPriorities(path), queryKey: ["core", "common", key] });
}
