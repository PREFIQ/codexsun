import { pincodeDefinition } from "../shared/location.definitions";
import { createLocationRecord, listLocationRecords, updateLocationRecord } from "../shared/location.services";

export const listPincodes = () => listLocationRecords(pincodeDefinition.path);
export const createPincode = (payload: Parameters<typeof createLocationRecord>[1]) => createLocationRecord(pincodeDefinition.path, payload);
export const updatePincode = (id: string, payload: Parameters<typeof updateLocationRecord>[2]) =>
  updateLocationRecord(pincodeDefinition.path, id, payload);

