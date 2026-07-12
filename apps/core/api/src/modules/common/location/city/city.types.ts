export type CityStatus = "active" | "inactive";

export type City = {
  id: string;
  uuid: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  countryId: string;
  countryName: string;
  name: string;
  sortOrder: number;
  status: CityStatus;
};

export type CitySavePayload = {
  districtId: string;
  name: string;
  sortOrder: number;
  status: CityStatus;
};

export type CityListFilters = { districtId?: string; search?: string };
