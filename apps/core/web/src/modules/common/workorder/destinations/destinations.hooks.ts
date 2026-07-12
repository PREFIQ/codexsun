import { useQuery } from "@tanstack/react-query";
import { listDestinations } from "./destinations.services";
export function useDestinationsQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listDestinations(path), queryKey: ["core", "common", key] });
}
