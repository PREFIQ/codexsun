import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { stockRejectionTypesDefinition } from "./stock-rejection-types.definition";
export function useStockRejectionTypesQuery() { return useCommonMasterQuery(stockRejectionTypesDefinition.key, stockRejectionTypesDefinition.path); }
