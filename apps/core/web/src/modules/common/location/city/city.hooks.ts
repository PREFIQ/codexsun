import { cityDefinition } from "../shared/location.definitions";
import { useCreateLocationRecord, useLocationRecords, useUpdateLocationRecord } from "../shared/location.hooks";

export const useCities = () => useLocationRecords(cityDefinition);
export const useCreateCity = () => useCreateLocationRecord(cityDefinition);
export const useUpdateCity = () => useUpdateLocationRecord(cityDefinition);

