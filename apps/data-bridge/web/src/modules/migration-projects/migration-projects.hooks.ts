import { useQuery } from "@tanstack/react-query";
import { fetchMigrationWorkflow } from "./migration-projects.services";

export function useMigrationWorkflow() {
  return useQuery({ queryKey: ["migration", "workflow"], queryFn: fetchMigrationWorkflow, staleTime: 60_000 });
}
