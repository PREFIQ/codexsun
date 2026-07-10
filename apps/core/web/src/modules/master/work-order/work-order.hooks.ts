import { useQuery } from "@tanstack/react-query";
import { listWorkOrders } from "./work-order.services";

export function useWorkOrders(search = "") {
  return useQuery({
    queryFn: () => listWorkOrders(search),
    queryKey: ["core", "work-order", "list", search]
  });
}
