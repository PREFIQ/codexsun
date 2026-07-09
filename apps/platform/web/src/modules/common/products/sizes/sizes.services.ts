import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { sizesDefinition } from "./sizes.definition";
export const listSizes = () => listCommonMaster(sizesDefinition.path);
export const createSizes = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(sizesDefinition.path, payload);
export const updateSizes = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(sizesDefinition.path, id, payload);
