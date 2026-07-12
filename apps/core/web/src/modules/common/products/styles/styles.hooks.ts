import { useQuery } from "@tanstack/react-query";
import { listStyles } from "./styles.services";
export function useStylesQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listStyles(path), queryKey: ["core", "common", key] });
}
