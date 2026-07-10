import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { taxesDefinition } from "./taxes.definition";
export function useTaxesQuery() { return useCommonMasterQuery(taxesDefinition.key, taxesDefinition.path); }
