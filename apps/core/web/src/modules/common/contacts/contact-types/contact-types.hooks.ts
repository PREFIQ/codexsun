import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { contactTypesDefinition } from "./contact-types.definition";
export function useContactTypesQuery() { return useCommonMasterQuery(contactTypesDefinition.key, contactTypesDefinition.path); }
