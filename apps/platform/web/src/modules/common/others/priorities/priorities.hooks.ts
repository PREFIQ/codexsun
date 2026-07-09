import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { prioritiesDefinition } from "./priorities.definition";
export function usePrioritiesQuery() { return useCommonMasterQuery(prioritiesDefinition.key, prioritiesDefinition.path); }
