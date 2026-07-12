export type StateStatus = "active" | "inactive";

export type State = {
  id: string;
  uuid: string;
  countryId: string;
  countryName: string;
  name: string;
  sortOrder: number;
  status: StateStatus;
};

export type StateSavePayload = {
  countryId: string;
  name: string;
  sortOrder: number;
  status: StateStatus;
};

export type StateListFilters = { countryId?: string; search?: string };
