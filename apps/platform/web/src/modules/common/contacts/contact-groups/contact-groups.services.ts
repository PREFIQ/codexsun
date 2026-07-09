import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { contactGroupsDefinition } from "./contact-groups.definition";
export const listContactGroups = () => listCommonMaster(contactGroupsDefinition.path);
export const createContactGroups = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(contactGroupsDefinition.path, payload);
export const updateContactGroups = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(contactGroupsDefinition.path, id, payload);
