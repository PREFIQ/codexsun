import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { salesTypesDefinition } from "./sales-types.definition";
export function useSalesTypesQuery() { return useCommonMasterQuery(salesTypesDefinition.key, salesTypesDefinition.path); }
