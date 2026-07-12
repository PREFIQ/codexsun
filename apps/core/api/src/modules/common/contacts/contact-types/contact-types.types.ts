export type ContactTypesRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type ContactTypesSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type ContactTypesListFilters = { search?: string };
