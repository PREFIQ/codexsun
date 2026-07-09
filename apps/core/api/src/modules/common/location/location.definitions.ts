import type { LocationDefinition } from "./shared/location.types.js";

export const countryLocationDefinition: LocationDefinition = {
  collectionPath: "/core/common/location/countries",
  defaultSortLabel: "India first, then country name",
  kind: "country",
  label: "Country",
  notFoundCode: "COUNTRY_NOT_FOUND",
  notFoundMessage: "Country was not found.",
  tableName: "core_countries"
};

export const stateLocationDefinition: LocationDefinition = {
  collectionPath: "/core/common/location/states",
  defaultSortLabel: "Unknown first, then GST state code",
  kind: "state",
  label: "State",
  notFoundCode: "STATE_NOT_FOUND",
  notFoundMessage: "State was not found.",
  tableName: "core_states"
};

export const districtLocationDefinition: LocationDefinition = {
  collectionPath: "/core/common/location/districts",
  defaultSortLabel: "Unknown first, then district name",
  kind: "district",
  label: "District",
  notFoundCode: "DISTRICT_NOT_FOUND",
  notFoundMessage: "District was not found.",
  tableName: "core_districts"
};

export const cityLocationDefinition: LocationDefinition = {
  collectionPath: "/core/common/location/cities",
  defaultSortLabel: "Unknown first, then city name",
  kind: "city",
  label: "City",
  notFoundCode: "CITY_NOT_FOUND",
  notFoundMessage: "City was not found.",
  tableName: "core_cities"
};

export const pincodeLocationDefinition: LocationDefinition = {
  collectionPath: "/core/common/location/pincodes",
  defaultSortLabel: "Unknown first, then pincode",
  kind: "pincode",
  label: "Pincode",
  notFoundCode: "PINCODE_NOT_FOUND",
  notFoundMessage: "Pincode was not found.",
  tableName: "core_pincodes"
};

export const locationDefinitions = [
  countryLocationDefinition,
  stateLocationDefinition,
  districtLocationDefinition,
  cityLocationDefinition,
  pincodeLocationDefinition
] as const;

