import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { salesTypesDefinition } from "./sales-types.definition";
export const listSalesTypes = () => listCommonMaster(salesTypesDefinition.path);
export const createSalesTypes = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(salesTypesDefinition.path, payload);
export const updateSalesTypes = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(salesTypesDefinition.path, id, payload);
