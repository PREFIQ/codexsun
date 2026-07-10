import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { monthsDefinition } from "./months.definition";
export const listMonths = () => listCommonMaster(monthsDefinition.path);
export const createMonths = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(monthsDefinition.path, payload);
export const updateMonths = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(monthsDefinition.path, id, payload);
