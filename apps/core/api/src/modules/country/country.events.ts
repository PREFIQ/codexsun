export const countryEvents = {
  activated: "core.country.activated",
  created: "core.country.created",
  deactivated: "core.country.deactivated",
  updated: "core.country.updated"
} as const;

export type CountryEventName = (typeof countryEvents)[keyof typeof countryEvents];

export function createCountryEvent(name: CountryEventName, countryId: string, correlationId: string) {
  return { correlationId, name, occurredAt: new Date().toISOString(), payload: { countryId }, version: 1 } as const;
}
