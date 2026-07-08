import { useQuery } from "@tanstack/react-query";
import { listSales } from "./sales.services";

export function useSales() {
  return useQuery({
    queryFn: listSales,
    queryKey: ["billing", "sales"]
  });
}
