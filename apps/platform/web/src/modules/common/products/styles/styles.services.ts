import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { stylesDefinition } from "./styles.definition";
export const listStyles = () => listCommonMaster(stylesDefinition.path);
export const createStyles = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(stylesDefinition.path, payload);
export const updateStyles = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(stylesDefinition.path, id, payload);
