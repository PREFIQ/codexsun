import { coreApiGet, coreApiPost, coreApiPut } from "../../../../shared/api/core-api";
import type { LocationRecord, LocationSavePayload } from "./location.types";

export function listLocationRecords(path: string) {
  return coreApiGet<LocationRecord[]>(path);
}

export function createLocationRecord(path: string, payload: LocationSavePayload) {
  return coreApiPost<LocationRecord>(path, payload);
}

export function updateLocationRecord(path: string, id: string, payload: LocationSavePayload) {
  return coreApiPut<LocationRecord>(`${path}/${id}`, payload);
}

