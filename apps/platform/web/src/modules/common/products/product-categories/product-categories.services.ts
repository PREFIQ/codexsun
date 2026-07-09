import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { productCategoriesDefinition } from "./product-categories.definition";
export const listProductCategories = () => listCommonMaster(productCategoriesDefinition.path);
export const createProductCategories = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(productCategoriesDefinition.path, payload);
export const updateProductCategories = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(productCategoriesDefinition.path, id, payload);
