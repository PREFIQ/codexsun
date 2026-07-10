import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { brandsDefinition } from "./brands.definition";
export function useBrandsQuery() { return useCommonMasterQuery(brandsDefinition.key, brandsDefinition.path); }
