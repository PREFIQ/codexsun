import { useQuery } from "@tanstack/react-query";
import { listProducts } from "./product.services";
export function useProducts(search = "") {
  return useQuery({
    queryFn: () => listProducts(search),
    queryKey: ["core", "product", "list", search]
  });
}
