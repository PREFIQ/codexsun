import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { contactGroupsDefinition } from "./contact-groups.definition";
export function useContactGroupsQuery() { return useCommonMasterQuery(contactGroupsDefinition.key, contactGroupsDefinition.path); }
