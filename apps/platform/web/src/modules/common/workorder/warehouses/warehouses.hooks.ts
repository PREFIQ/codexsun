import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { warehousesDefinition } from "./warehouses.definition";
export function useWarehousesQuery() { return useCommonMasterQuery(warehousesDefinition.key, warehousesDefinition.path); }
