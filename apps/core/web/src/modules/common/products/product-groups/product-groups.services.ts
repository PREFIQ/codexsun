import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { productGroupsDefinition } from "./product-groups.definition";
export const listProductGroups = () => listCommonMaster(productGroupsDefinition.path);
export const createProductGroups = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(productGroupsDefinition.path, payload);
export const updateProductGroups = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(productGroupsDefinition.path, id, payload);
