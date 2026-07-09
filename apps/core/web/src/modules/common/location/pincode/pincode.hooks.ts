import { pincodeDefinition } from "../shared/location.definitions";
import { useCreateLocationRecord, useLocationRecords, useUpdateLocationRecord } from "../shared/location.hooks";

export const usePincodes = () => useLocationRecords(pincodeDefinition);
export const useCreatePincode = () => useCreateLocationRecord(pincodeDefinition);
export const useUpdatePincode = () => useUpdateLocationRecord(pincodeDefinition);

