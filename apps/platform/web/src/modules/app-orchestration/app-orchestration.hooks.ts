import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listOrchestratedApps,
  restartOrchestratedService,
  startOrchestratedApp,
  startOrchestratedService,
  stopOrchestratedApp,
  stopOrchestratedService,
  updateOrchestratedApp
} from "./app-orchestration.services";
import type { OrchestratedAppId } from "./app-orchestration.types";
export const appOperationsKey = ["sa", "app-operations"] as const;
export function useAppOperationsQuery() {
  return useQuery({
    queryKey: appOperationsKey,
    queryFn: listOrchestratedApps,
    refetchInterval: 5000
  });
}
export function useAppOperationActions() {
  const client = useQueryClient();
  const done = () => client.invalidateQueries({ queryKey: appOperationsKey });
  return {
    start: useMutation({
      mutationFn: (id: OrchestratedAppId) => startOrchestratedApp(id),
      onSuccess: done
    }),
    stop: useMutation({
      mutationFn: (id: OrchestratedAppId) => stopOrchestratedApp(id),
      onSuccess: done
    }),
    update: useMutation({
      mutationFn: (id: OrchestratedAppId) => updateOrchestratedApp(id),
      onSuccess: done
    }),
    startService: useMutation({
      mutationFn: ({ id, serviceId }: { id: OrchestratedAppId; serviceId: "api" | "web" }) =>
        startOrchestratedService(id, serviceId),
      onSuccess: done
    }),
    stopService: useMutation({
      mutationFn: ({ id, serviceId }: { id: OrchestratedAppId; serviceId: "api" | "web" }) =>
        stopOrchestratedService(id, serviceId),
      onSuccess: done
    }),
    restartService: useMutation({
      mutationFn: ({ id, serviceId }: { id: OrchestratedAppId; serviceId: "api" | "web" }) =>
        restartOrchestratedService(id, serviceId),
      onSuccess: done
    })
  };
}
