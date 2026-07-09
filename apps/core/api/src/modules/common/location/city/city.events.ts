import type { City } from "./city.types.js";

export const cityEvents = {
  created: "core.common.location.city.created",
  statusChanged: "core.common.location.city.status_changed",
  updated: "core.common.location.city.updated"
} as const;

export function createCityEvent(eventName: (typeof cityEvents)[keyof typeof cityEvents], city: City) {
  return { eventName, payload: city, tenantId: city.tenantId, version: 1 };
}

