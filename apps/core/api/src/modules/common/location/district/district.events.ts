import type { District } from "./district.types.js";

export const districtEvents = {
  created: "core.common.location.district.created",
  statusChanged: "core.common.location.district.status_changed",
  updated: "core.common.location.district.updated"
} as const;

export function createDistrictEvent(eventName: (typeof districtEvents)[keyof typeof districtEvents], district: District) {
  return { eventName, payload: district, tenantId: district.tenantId, version: 1 };
}

