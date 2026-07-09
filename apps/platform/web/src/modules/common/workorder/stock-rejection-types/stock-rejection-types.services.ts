import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { stockRejectionTypesDefinition } from "./stock-rejection-types.definition";
export const listStockRejectionTypes = () => listCommonMaster(stockRejectionTypesDefinition.path);
export const createStockRejectionTypes = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(stockRejectionTypesDefinition.path, payload);
export const updateStockRejectionTypes = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(stockRejectionTypesDefinition.path, id, payload);
