import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { hsnCodesDefinition } from "./hsn-codes.definition";
export const listHsnCodes = () => listCommonMaster(hsnCodesDefinition.path);
export const createHsnCodes = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(hsnCodesDefinition.path, payload);
export const updateHsnCodes = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(hsnCodesDefinition.path, id, payload);
