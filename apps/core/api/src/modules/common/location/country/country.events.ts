import type { Country } from "./country.types.js";

export const countryEvents = {
  created: "core.common.location.country.created",
  statusChanged: "core.common.location.country.status_changed",
  updated: "core.common.location.country.updated"
} as const;

export function createCountryEvent(eventName: (typeof countryEvents)[keyof typeof countryEvents], country: Country) {
  return {
    eventName,
    payload: country,
    tenantId: country.tenantId,
    version: 1
  };
}

