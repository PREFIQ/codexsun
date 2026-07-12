export type DistrictStatus = "active" | "inactive";

export type District = {
  id: string;
  uuid: string;
  stateId: string;
  stateName: string;
  countryId: string;
  countryName: string;
  name: string;
  sortOrder: number;
  status: DistrictStatus;
};

export type DistrictSavePayload = {
  stateId: string;
  name: string;
  sortOrder: number;
  status: DistrictStatus;
};

export type DistrictListFilters = { stateId?: string; search?: string };
