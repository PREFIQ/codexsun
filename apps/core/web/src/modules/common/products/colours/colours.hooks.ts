import { useQuery } from "@tanstack/react-query";
import { listColours } from "./colours.services";
export function useColoursQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listColours(path), queryKey: ["core", "common", key] });
}
