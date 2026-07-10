import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { workOrderTypesDefinition } from "./work-order-types.definition";
export const listWorkOrderTypes = () => listCommonMaster(workOrderTypesDefinition.path);
export const createWorkOrderTypes = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(workOrderTypesDefinition.path, payload);
export const updateWorkOrderTypes = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(workOrderTypesDefinition.path, id, payload);
