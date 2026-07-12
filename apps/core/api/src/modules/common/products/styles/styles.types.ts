export type StylesRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type StylesSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type StylesListFilters = { search?: string };
