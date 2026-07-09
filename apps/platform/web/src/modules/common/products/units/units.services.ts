import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { unitsDefinition } from "./units.definition";
export const listUnits = () => listCommonMaster(unitsDefinition.path);
export const createUnits = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(unitsDefinition.path, payload);
export const updateUnits = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(unitsDefinition.path, id, payload);
