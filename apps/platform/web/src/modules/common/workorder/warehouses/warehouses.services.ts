import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { warehousesDefinition } from "./warehouses.definition";
export const listWarehouses = () => listCommonMaster(warehousesDefinition.path);
export const createWarehouses = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(warehousesDefinition.path, payload);
export const updateWarehouses = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(warehousesDefinition.path, id, payload);
