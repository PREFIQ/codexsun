import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { brandsDefinition } from "./brands.definition";
export const listBrands = () => listCommonMaster(brandsDefinition.path);
export const createBrands = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(brandsDefinition.path, payload);
export const updateBrands = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(brandsDefinition.path, id, payload);
