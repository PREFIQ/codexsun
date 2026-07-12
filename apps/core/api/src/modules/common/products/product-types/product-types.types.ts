export type ProductTypesRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type ProductTypesSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type ProductTypesListFilters = { search?: string };
