import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createServiceOrder,
  listServiceOrders,
  transitionServiceOrder
} from "./service-orders.services";
import type { ServiceOrderInput, ServiceOrderStatus } from "./service-orders.types";
export function useServiceOrders(status?: ServiceOrderStatus) {
  return useQuery({
    queryKey: ["kitchen-serve", "orders", status ?? "all"],
    queryFn: () => listServiceOrders(status),
    retry: false
  });
}
export function useServiceOrderActions() {
  const client = useQueryClient();
  const done = () => client.invalidateQueries({ queryKey: ["kitchen-serve", "orders"] });
  return {
    create: useMutation({
      mutationFn: (input: ServiceOrderInput) => createServiceOrder(input),
      onSuccess: done
    }),
    transition: useMutation({
      mutationFn: ({ id, status }: { id: string; status: ServiceOrderStatus }) =>
        transitionServiceOrder(id, status),
      onSuccess: done
    })
  };
}
