export type WorkOrderTypesRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type WorkOrderTypesSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type WorkOrderTypesListFilters = { search?: string };
