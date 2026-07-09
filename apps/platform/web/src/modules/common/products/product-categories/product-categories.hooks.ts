import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { productCategoriesDefinition } from "./product-categories.definition";
export function useProductCategoriesQuery() { return useCommonMasterQuery(productCategoriesDefinition.key, productCategoriesDefinition.path); }
