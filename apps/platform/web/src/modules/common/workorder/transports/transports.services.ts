import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { transportsDefinition } from "./transports.definition";
export const listTransports = () => listCommonMaster(transportsDefinition.path);
export const createTransports = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(transportsDefinition.path, payload);
export const updateTransports = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(transportsDefinition.path, id, payload);
