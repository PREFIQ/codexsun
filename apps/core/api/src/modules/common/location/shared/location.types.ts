export type LocationStatus = "active" | "inactive";

export type LocationTenantId = "global" | string;

export type LocationKind = "country" | "state" | "district" | "city" | "pincode";

export type LocationRecord = {
  areaName?: string | null;
  capital?: string | null;
  cityId?: string | null;
  cityName?: string | null;
  code: string;
  countryId?: string | null;
  countryName?: string | null;
  currencyCode?: string | null;
  dialCode?: string | null;
  districtId?: string | null;
  districtName?: string | null;
  gstStateCode?: string | null;
  id: string;
  iso2?: string | null;
  iso3?: string | null;
  name: string;
  numericCode?: string | null;
  pincode?: string | null;
  shortCode?: string | null;
  sortOrder: number;
  stateId?: string | null;
  stateName?: string | null;
  status: LocationStatus;
  tenantId: LocationTenantId;
  uuid: string;
};

export type LocationSavePayload = Omit<LocationRecord, "id" | "tenantId" | "uuid"> & {
  id?: string;
};

export type LocationListFilters = {
  cityId?: string;
  countryId?: string;
  districtId?: string;
  search?: string;
  stateId?: string;
};

export type LocationDefinition = {
  allowGlobalMutations: boolean;
  collectionPath: string;
  defaultSortLabel: string;
  dependents: Array<{
    columnName: "city_id" | "country_id" | "district_id" | "state_id";
    label: string;
    tableName: string;
  }>;
  kind: LocationKind;
  label: string;
  notFoundCode: string;
  notFoundMessage: string;
  tableName: string;
};

export type LocationSeedRecord = LocationSavePayload & {
  id: string;
  tenantId?: LocationTenantId;
};
