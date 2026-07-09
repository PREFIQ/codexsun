import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { hsnCodesDefinition } from "./hsn-codes.definition";
export function useHsnCodesQuery() { return useCommonMasterQuery(hsnCodesDefinition.key, hsnCodesDefinition.path); }
