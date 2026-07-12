export type AddressTypesRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type AddressTypesSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type AddressTypesListFilters = { search?: string };
