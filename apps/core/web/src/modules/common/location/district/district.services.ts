import { districtDefinition } from "../shared/location.definitions";
import { createLocationRecord, listLocationRecords, updateLocationRecord } from "../shared/location.services";

export const listDistricts = () => listLocationRecords(districtDefinition.path);
export const createDistrict = (payload: Parameters<typeof createLocationRecord>[1]) => createLocationRecord(districtDefinition.path, payload);
export const updateDistrict = (id: string, payload: Parameters<typeof updateLocationRecord>[2]) =>
  updateLocationRecord(districtDefinition.path, id, payload);

