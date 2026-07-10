import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { addressTypesDefinition } from "./address-types.definition";
export const listAddressTypes = () => listCommonMaster(addressTypesDefinition.path);
export const createAddressTypes = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(addressTypesDefinition.path, payload);
export const updateAddressTypes = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(addressTypesDefinition.path, id, payload);
