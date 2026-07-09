import type { LocationDefinition } from "./location.types";

export const countryDefinition: LocationDefinition = {
  columns: ["name", "iso2", "dialCode", "currencyCode", "status"],
  kind: "country",
  label: "Country",
  path: "/core/common/location/countries",
  routePath: "/core/common/location/countries"
};

export const stateDefinition: LocationDefinition = {
  columns: ["name", "gstStateCode", "shortCode", "countryName", "status"],
  kind: "state",
  label: "State",
  path: "/core/common/location/states",
  routePath: "/core/common/location/states"
};

export const districtDefinition: LocationDefinition = {
  columns: ["name", "stateName", "countryName", "status"],
  kind: "district",
  label: "District",
  path: "/core/common/location/districts",
  routePath: "/core/common/location/districts"
};

export const cityDefinition: LocationDefinition = {
  columns: ["name", "districtName", "stateName", "countryName", "status"],
  kind: "city",
  label: "City",
  path: "/core/common/location/cities",
  routePath: "/core/common/location/cities"
};

export const pincodeDefinition: LocationDefinition = {
  columns: ["pincode", "areaName", "cityName", "stateName", "status"],
  kind: "pincode",
  label: "Pincode",
  path: "/core/common/location/pincodes",
  routePath: "/core/common/location/pincodes"
};

export const locationDefinitions = [
  countryDefinition,
  stateDefinition,
  districtDefinition,
  cityDefinition,
  pincodeDefinition
] as const;

