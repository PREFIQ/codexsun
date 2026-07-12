import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAndSubmitServiceOrder,
  listServiceOrders,
  transitionServiceOrder
} from "./service-orders.services";
import type { ServiceOrderInput, ServiceOrderStatus } from "./service-orders.types";
export function useServiceOrders(status?: ServiceOrderStatus, enabled = true) {
  return useQuery({
    enabled,
    queryKey: ["kitchen-serve", "orders", status ?? "all"],
    queryFn: () => listServiceOrders(status),
    refetchInterval: enabled ? 2000 : false,
    refetchIntervalInBackground: true,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    retry: false,
    staleTime: 750
  });
}
export function useServiceOrderActions() {
  const client = useQueryClient();
  const done = () => client.invalidateQueries({ queryKey: ["kitchen-serve", "orders"] });
  return {
    create: useMutation({
      mutationFn: (input: ServiceOrderInput) => createAndSubmitServiceOrder(input),
      onSuccess: done
    }),
    transition: useMutation({
      mutationFn: ({ id, status }: { id: string; status: ServiceOrderStatus }) =>
        transitionServiceOrder(id, status),
      onSuccess: done
    })
  };
}
