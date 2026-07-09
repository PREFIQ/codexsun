import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { sizesDefinition } from "./sizes.definition";
export function useSizesQuery() { return useCommonMasterQuery(sizesDefinition.key, sizesDefinition.path); }
