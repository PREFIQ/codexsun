import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { currenciesDefinition } from "./currencies.definition";
export const listCurrencies = () => listCommonMaster(currenciesDefinition.path);
export const createCurrencies = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(currenciesDefinition.path, payload);
export const updateCurrencies = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(currenciesDefinition.path, id, payload);
