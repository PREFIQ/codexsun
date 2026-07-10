import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { unitsDefinition } from "./units.definition";
export function useUnitsQuery() { return useCommonMasterQuery(unitsDefinition.key, unitsDefinition.path); }
