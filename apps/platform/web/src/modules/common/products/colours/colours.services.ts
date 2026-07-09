import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { coloursDefinition } from "./colours.definition";
export const listColours = () => listCommonMaster(coloursDefinition.path);
export const createColours = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(coloursDefinition.path, payload);
export const updateColours = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(coloursDefinition.path, id, payload);
