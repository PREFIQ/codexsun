import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { bankNamesDefinition } from "./bank-names.definition";
export function useBankNamesQuery() { return useCommonMasterQuery(bankNamesDefinition.key, bankNamesDefinition.path); }
