import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { transportsDefinition } from "./transports.definition";
export function useTransportsQuery() { return useCommonMasterQuery(transportsDefinition.key, transportsDefinition.path); }
