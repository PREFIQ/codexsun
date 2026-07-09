import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { destinationsDefinition } from "./destinations.definition";
export function useDestinationsQuery() { return useCommonMasterQuery(destinationsDefinition.key, destinationsDefinition.path); }
