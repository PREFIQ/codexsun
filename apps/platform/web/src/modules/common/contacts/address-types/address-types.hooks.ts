import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { addressTypesDefinition } from "./address-types.definition";
export function useAddressTypesQuery() { return useCommonMasterQuery(addressTypesDefinition.key, addressTypesDefinition.path); }
