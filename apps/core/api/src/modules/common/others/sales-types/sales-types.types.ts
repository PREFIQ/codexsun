export type SalesTypesRecord = {
  id: string;
  uuid: string;
  name: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type SalesTypesSavePayload = {
  name: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
};

export type SalesTypesListFilters = { search?: string };
