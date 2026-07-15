import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMigrationJob,
  listMigrationJobs,
  updateMigrationJob
} from "./migration-manager.services";
import type { MigrationJobInput } from "./migration-manager.types";
export const migrationManagerKeys = { all: ["data-bridge", "migration-jobs"] as const };
export function useMigrationManagerJobs() {
  return useQuery({ queryKey: migrationManagerKeys.all, queryFn: listMigrationJobs });
}
export function useMigrationManagerActions() {
  const client = useQueryClient();
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: migrationManagerKeys.all });
  };
  return {
    create: useMutation({ mutationFn: createMigrationJob, onSuccess: refresh }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: number; input: MigrationJobInput }) =>
        updateMigrationJob(id, input),
      onSuccess: refresh
    })
  };
}
