import { useQuery } from "@tanstack/react-query";
import { listProductCategories } from "./product-categories.services";
export function useProductCategoriesQuery(key: string, path: string) {
  return useQuery({
    queryFn: () => listProductCategories(path),
    queryKey: ["core", "common", key]
  });
}
