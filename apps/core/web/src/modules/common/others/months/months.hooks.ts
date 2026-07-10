import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { monthsDefinition } from "./months.definition";
export function useMonthsQuery() { return useCommonMasterQuery(monthsDefinition.key, monthsDefinition.path); }
