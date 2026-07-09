import { districtDefinition } from "../shared/location.definitions";
import { useCreateLocationRecord, useLocationRecords, useUpdateLocationRecord } from "../shared/location.hooks";

export const useDistricts = () => useLocationRecords(districtDefinition);
export const useCreateDistrict = () => useCreateLocationRecord(districtDefinition);
export const useUpdateDistrict = () => useUpdateLocationRecord(districtDefinition);

