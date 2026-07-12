import { useQuery } from "@tanstack/react-query";
import { listContactGroups } from "./contact-groups.services";
export function useContactGroupsQuery(key: string, path: string) {
  return useQuery({ queryFn: () => listContactGroups(path), queryKey: ["core", "common", key] });
}
