export type ContactGroupsRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type ContactGroupsSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type ContactGroupsListFilters = { search?: string };
