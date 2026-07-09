import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { prioritiesDefinition } from "./priorities.definition";
export const listPriorities = () => listCommonMaster(prioritiesDefinition.path);
export const createPriorities = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(prioritiesDefinition.path, payload);
export const updatePriorities = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(prioritiesDefinition.path, id, payload);
