import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { workOrderTypesDefinition } from "./work-order-types.definition";
export function useWorkOrderTypesQuery() { return useCommonMasterQuery(workOrderTypesDefinition.key, workOrderTypesDefinition.path); }
