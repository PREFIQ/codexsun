export type PincodeKind = "country" | "state" | "district" | "city" | "pincode";
export type PincodeStatus = "active" | "inactive";

export type PincodeRecord = {
  areaName?: string | null;
  capital?: string | null;
  cityId?: number | string | null;
  cityName?: string | null;
  code: string;
  countryId?: number | string | null;
  countryName?: string | null;
  currencyCode?: string | null;
  dialCode?: string | null;
  districtId?: number | string | null;
  districtName?: string | null;
  gstStateCode?: string | null;
  id: number;
  iso2?: string | null;
  iso3?: string | null;
  name: string;
  numericCode?: string | null;
  pincode?: string | null;
  shortCode?: string | null;
  sortOrder: number;
  stateId?: number | string | null;
  stateName?: string | null;
  status: PincodeStatus;
};

export type PincodeSavePayload = Omit<PincodeRecord, "id">;

export type PincodeDefinition = {
  columns: Array<{ key: keyof PincodeRecord; label: string }>;
  kind: PincodeKind;
  label: string;
  path: string;
  plural: string;
};

export const pincodeDefinitions: Record<PincodeKind, PincodeDefinition> = {
  country: {
    columns: [
      { key: "name", label: "Country" },
      { key: "code", label: "Country code" },
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
      { key: "gstStateCode", label: "GST State code" },
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
};
