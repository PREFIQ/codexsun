import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { bankNamesDefinition } from "./bank-names.definition";
export const listBankNames = () => listCommonMaster(bankNamesDefinition.path);
export const createBankNames = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(bankNamesDefinition.path, payload);
export const updateBankNames = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(bankNamesDefinition.path, id, payload);
