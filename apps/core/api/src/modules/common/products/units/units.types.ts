export type UnitsRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type UnitsSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type UnitsListFilters = { search?: string };
