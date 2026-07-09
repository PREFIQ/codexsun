import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { coloursDefinition } from "./colours.definition";
export function useColoursQuery() { return useCommonMasterQuery(coloursDefinition.key, coloursDefinition.path); }
