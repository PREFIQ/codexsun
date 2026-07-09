import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { contactTypesDefinition } from "./contact-types.definition";
export const listContactTypes = () => listCommonMaster(contactTypesDefinition.path);
export const createContactTypes = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(contactTypesDefinition.path, payload);
export const updateContactTypes = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(contactTypesDefinition.path, id, payload);
