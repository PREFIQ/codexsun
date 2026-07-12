export type StockRejectionTypesRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type StockRejectionTypesSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type StockRejectionTypesListFilters = { search?: string };
