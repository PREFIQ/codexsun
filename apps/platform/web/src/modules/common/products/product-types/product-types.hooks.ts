import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { productTypesDefinition } from "./product-types.definition";
export function useProductTypesQuery() { return useCommonMasterQuery(productTypesDefinition.key, productTypesDefinition.path); }
