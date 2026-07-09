import { countryDefinition } from "../shared/location.definitions";
import { createLocationRecord, listLocationRecords, updateLocationRecord } from "../shared/location.services";

export const listCountries = () => listLocationRecords(countryDefinition.path);
export const createCountry = (payload: Parameters<typeof createLocationRecord>[1]) => createLocationRecord(countryDefinition.path, payload);
export const updateCountry = (id: string, payload: Parameters<typeof updateLocationRecord>[2]) =>
  updateLocationRecord(countryDefinition.path, id, payload);

