import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addReconciliationException,
  exportReconciliationAudit,
  generateReconciliationReport,
  listCompletedExecutionOptions,
  listReconciliationReports,
  resolveReconciliationException,
  signOffReconciliation
} from "./reconciliation-audit.services";
import type { AddExceptionInput, SignOffInput } from "./reconciliation-audit.types";
export const reconciliationKeys = {
  all: ["data-bridge", "reconciliation-reports"] as const,
  runs: ["data-bridge", "completed-execution-options"] as const
};
export function useReconciliationReports() {
  return useQuery({ queryKey: reconciliationKeys.all, queryFn: listReconciliationReports });
}
export function useCompletedExecutionOptions() {
  return useQuery({ queryKey: reconciliationKeys.runs, queryFn: listCompletedExecutionOptions });
}
export function useReconciliationActions() {
  const client = useQueryClient();
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: reconciliationKeys.all }),
      client.invalidateQueries({ queryKey: reconciliationKeys.runs })
    ]);
  };
  return {
    generate: useMutation({ mutationFn: generateReconciliationReport, onSuccess: refresh }),
    addException: useMutation({
      mutationFn: ({ id, input }: { id: number; input: AddExceptionInput }) =>
        addReconciliationException(id, input),
      onSuccess: refresh
    }),
    resolve: useMutation({
      mutationFn: ({
        id,
        exceptionId,
        input
      }: {
        id: number;
        exceptionId: string;
        input: { actor: string; resolution: string };
      }) => resolveReconciliationException(id, exceptionId, input),
      onSuccess: refresh
    }),
    sign: useMutation({
      mutationFn: ({ id, input }: { id: number; input: SignOffInput }) =>
        signOffReconciliation(id, input),
      onSuccess: refresh
    }),
    exportAudit: useMutation({ mutationFn: exportReconciliationAudit })
  };
}
