import { stateDefinition } from "../shared/location.definitions";
import { createLocationRecord, listLocationRecords, updateLocationRecord } from "../shared/location.services";

export const listStates = () => listLocationRecords(stateDefinition.path);
export const createState = (payload: Parameters<typeof createLocationRecord>[1]) => createLocationRecord(stateDefinition.path, payload);
export const updateState = (id: string, payload: Parameters<typeof updateLocationRecord>[2]) =>
  updateLocationRecord(stateDefinition.path, id, payload);

