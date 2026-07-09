import { cityDefinition } from "../shared/location.definitions";
import { createLocationRecord, listLocationRecords, updateLocationRecord } from "../shared/location.services";

export const listCities = () => listLocationRecords(cityDefinition.path);
export const createCity = (payload: Parameters<typeof createLocationRecord>[1]) => createLocationRecord(cityDefinition.path, payload);
export const updateCity = (id: string, payload: Parameters<typeof updateLocationRecord>[2]) =>
  updateLocationRecord(cityDefinition.path, id, payload);

