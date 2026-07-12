export type WarehousesRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type WarehousesSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type WarehousesListFilters = { search?: string };
