import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { productGroupsDefinition } from "./product-groups.definition";
export function useProductGroupsQuery() { return useCommonMasterQuery(productGroupsDefinition.key, productGroupsDefinition.path); }
