import { countryDefinition } from "../shared/location.definitions";
import { useCreateLocationRecord, useLocationRecords, useUpdateLocationRecord } from "../shared/location.hooks";

export const useCountries = () => useLocationRecords(countryDefinition);
export const useCreateCountry = () => useCreateLocationRecord(countryDefinition);
export const useUpdateCountry = () => useUpdateLocationRecord(countryDefinition);

