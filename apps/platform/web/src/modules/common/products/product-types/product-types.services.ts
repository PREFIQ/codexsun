import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { productTypesDefinition } from "./product-types.definition";
export const listProductTypes = () => listCommonMaster(productTypesDefinition.path);
export const createProductTypes = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(productTypesDefinition.path, payload);
export const updateProductTypes = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(productTypesDefinition.path, id, payload);
