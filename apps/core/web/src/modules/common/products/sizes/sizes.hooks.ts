import { useQuery } from "@tanstack/react-query";
import { listSizes } from "./sizes.services";
export function useSizesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listSizes(path), queryKey: ["core", "common", key] });
}
