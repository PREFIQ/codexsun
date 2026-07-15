import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createExecutionRun,
  decideExecutionConflict,
  executionAction,
  listExecutionReviewOptions,
  listExecutionRuns
} from "./execution-runs.services";
import type { ConflictDecisionInput } from "./execution-runs.types";
export const executionKeys = {
  all: ["data-bridge", "execution-runs"] as const,
  reviews: ["data-bridge", "execution-review-options"] as const
};
export function useExecutionRuns() {
  return useQuery({
    queryKey: executionKeys.all,
    queryFn: listExecutionRuns,
    refetchInterval: 2000
  });
}
export function useExecutionReviewOptions() {
  return useQuery({ queryKey: executionKeys.reviews, queryFn: listExecutionReviewOptions });
}
export function useExecutionActions() {
  const client = useQueryClient();
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: executionKeys.all });
  };
  return {
    create: useMutation({ mutationFn: createExecutionRun, onSuccess: refresh }),
    lifecycle: useMutation({
      mutationFn: ({
        id,
        action,
        actor
      }: {
        id: number;
        action: "pause" | "resume" | "cancel" | "retry";
        actor: string;
      }) => executionAction(id, action, actor),
      onSuccess: refresh
    }),
    conflict: useMutation({
      mutationFn: ({
        id,
        conflictId,
        input
      }: {
        id: number;
        conflictId: string;
        input: ConflictDecisionInput;
      }) => decideExecutionConflict(id, conflictId, input),
      onSuccess: refresh
    })
  };
}
