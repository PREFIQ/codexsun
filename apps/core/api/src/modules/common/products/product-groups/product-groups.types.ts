export type ProductGroupsRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type ProductGroupsSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type ProductGroupsListFilters = { search?: string };
