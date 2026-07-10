import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { currenciesDefinition } from "./currencies.definition";
export function useCurrenciesQuery() { return useCommonMasterQuery(currenciesDefinition.key, currenciesDefinition.path); }
