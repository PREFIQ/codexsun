import type { LocationDefinition, LocationKind } from "./location.types"

export const locationDefinitions: Record<LocationKind, LocationDefinition> = {
  country: {
    columns: [
      { key: "name", label: "Country" },
      { key: "iso2", label: "ISO 2" },
      { key: "dialCode", label: "Dial code" },
      { key: "currencyCode", label: "Currency" },
      { key: "status", label: "Status" }
    ],
    kind: "country",
    label: "Country",
    path: "/core/common/location/countries",
    plural: "Countries"
  },
  state: {
    columns: [
      { key: "name", label: "State" },
      { key: "gstStateCode", label: "GST code" },
      { key: "shortCode", label: "Short code" },
      { key: "countryName", label: "Country" },
      { key: "status", label: "Status" }
    ],
    kind: "state",
    label: "State",
    path: "/core/common/location/states",
    plural: "States"
  },
  district: {
    columns: [
      { key: "name", label: "District" },
      { key: "stateName", label: "State" },
      { key: "countryName", label: "Country" },
      { key: "status", label: "Status" }
    ],
    kind: "district",
    label: "District",
    path: "/core/common/location/districts",
    plural: "Districts"
  },
  city: {
    columns: [
      { key: "name", label: "City" },
      { key: "districtName", label: "District" },
      { key: "stateName", label: "State" },
      { key: "countryName", label: "Country" },
      { key: "status", label: "Status" }
    ],
    kind: "city",
    label: "City",
    path: "/core/common/location/cities",
    plural: "Cities"
  },
  pincode: {
    columns: [
      { key: "pincode", label: "Pincode" },
      { key: "areaName", label: "Area" },
      { key: "cityName", label: "City" },
      { key: "stateName", label: "State" },
      { key: "status", label: "Status" }
    ],
    kind: "pincode",
    label: "Pincode",
    path: "/core/common/location/pincodes",
    plural: "Pincodes"
  }
}
