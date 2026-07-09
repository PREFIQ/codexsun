import type { LocationDefinition } from "./shared/location.types.js";

export const countryLocationDefinition: LocationDefinition = {
  allowGlobalMutations: false,
  collectionPath: "/core/common/location/countries",
  defaultSortLabel: "India first, then country name",
  dependents: [
    { columnName: "country_id", label: "states", tableName: "core_states" },
    { columnName: "country_id", label: "districts", tableName: "core_districts" },
    { columnName: "country_id", label: "cities", tableName: "core_cities" },
    { columnName: "country_id", label: "pincodes", tableName: "core_pincodes" }
  ],
  kind: "country",
  label: "Country",
  notFoundCode: "COUNTRY_NOT_FOUND",
  notFoundMessage: "Country was not found.",
  tableName: "core_countries"
};

export const stateLocationDefinition: LocationDefinition = {
  allowGlobalMutations: false,
  collectionPath: "/core/common/location/states",
  defaultSortLabel: "Unknown first, then GST state code",
  dependents: [
    { columnName: "state_id", label: "districts", tableName: "core_districts" },
    { columnName: "state_id", label: "cities", tableName: "core_cities" },
    { columnName: "state_id", label: "pincodes", tableName: "core_pincodes" }
  ],
  kind: "state",
  label: "State",
  notFoundCode: "STATE_NOT_FOUND",
  notFoundMessage: "State was not found.",
  tableName: "core_states"
};

export const districtLocationDefinition: LocationDefinition = {
  allowGlobalMutations: true,
  collectionPath: "/core/common/location/districts",
  defaultSortLabel: "Unknown first, then district name",
  dependents: [
    { columnName: "district_id", label: "cities", tableName: "core_cities" },
    { columnName: "district_id", label: "pincodes", tableName: "core_pincodes" }
  ],
  kind: "district",
  label: "District",
  notFoundCode: "DISTRICT_NOT_FOUND",
  notFoundMessage: "District was not found.",
  tableName: "core_districts"
};

export const cityLocationDefinition: LocationDefinition = {
  allowGlobalMutations: true,
  collectionPath: "/core/common/location/cities",
  defaultSortLabel: "Unknown first, then city name",
  dependents: [
    { columnName: "city_id", label: "pincodes", tableName: "core_pincodes" }
  ],
  kind: "city",
  label: "City",
  notFoundCode: "CITY_NOT_FOUND",
  notFoundMessage: "City was not found.",
  tableName: "core_cities"
};

export const pincodeLocationDefinition: LocationDefinition = {
  allowGlobalMutations: true,
  collectionPath: "/core/common/location/pincodes",
  defaultSortLabel: "Unknown first, then pincode",
  dependents: [],
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

