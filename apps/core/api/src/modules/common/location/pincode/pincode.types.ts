export type PincodeStatus = "active" | "inactive";

export type Pincode = {
  id: string;
  uuid: string;
  cityId: string;
  name: string;
  sortOrder: number;
  status: PincodeStatus;
};

export type PincodeWithRelations = Pincode & {
  cityName: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  countryId: string;
  countryName: string;
};

export type PincodeSavePayload = {
  cityId: string;
  name: string;
  sortOrder: number;
  status: PincodeStatus;
};

export type PincodeListFilters = { cityId?: string; search?: string };
