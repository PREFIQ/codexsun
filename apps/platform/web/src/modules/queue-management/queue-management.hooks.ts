import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queueJobAction } from "./queue-management.schema";
import { cancelQueueJob, getQueueRuntimeSettings, listQueueJobs, retryQueueJob, runQueueJob } from "./queue-management.services";

export const queueManagementQueryKey = ["admin", "queue-management"] as const;

export function useQueueRuntimeQuery() {
  return useQuery({ queryFn: getQueueRuntimeSettings, queryKey: [...queueManagementQueryKey, "settings"], refetchInterval: 10_000 });
}

export function useQueueJobsQuery() {
  return useQuery({ queryFn: listQueueJobs, queryKey: [...queueManagementQueryKey, "jobs"], refetchInterval: 10_000 });
}

export function useQueueJobMutations() {
  const client = useQueryClient();
  const done = () => {
    void client.invalidateQueries({ queryKey: queueManagementQueryKey });
    void client.invalidateQueries({ queryKey: ["admin", "database"] });
  };
  return {
    cancel: useMutation({ mutationFn: (id: number) => cancelQueueJob(queueJobAction(id).id), onSuccess: done }),
    retry: useMutation({ mutationFn: (id: number) => retryQueueJob(queueJobAction(id).id), onSuccess: done }),
    run: useMutation({ mutationFn: (id: number) => runQueueJob(queueJobAction(id).id), onSuccess: done })
  };
}
