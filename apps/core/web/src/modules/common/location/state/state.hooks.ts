import { stateDefinition } from "../shared/location.definitions";
import { useCreateLocationRecord, useLocationRecords, useUpdateLocationRecord } from "../shared/location.hooks";

export const useStates = () => useLocationRecords(stateDefinition);
export const useCreateState = () => useCreateLocationRecord(stateDefinition);
export const useUpdateState = () => useUpdateLocationRecord(stateDefinition);

