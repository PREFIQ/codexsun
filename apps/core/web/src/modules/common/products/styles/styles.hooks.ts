import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { stylesDefinition } from "./styles.definition";
export function useStylesQuery() { return useCommonMasterQuery(stylesDefinition.key, stylesDefinition.path); }
