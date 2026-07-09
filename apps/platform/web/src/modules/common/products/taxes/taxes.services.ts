import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { taxesDefinition } from "./taxes.definition";
export const listTaxes = () => listCommonMaster(taxesDefinition.path);
export const createTaxes = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(taxesDefinition.path, payload);
export const updateTaxes = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(taxesDefinition.path, id, payload);
