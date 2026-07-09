import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { destinationsDefinition } from "./destinations.definition";
export const listDestinations = () => listCommonMaster(destinationsDefinition.path);
export const createDestinations = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(destinationsDefinition.path, payload);
export const updateDestinations = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(destinationsDefinition.path, id, payload);
