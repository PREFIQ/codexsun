export type MonthsRecord = {
  id: string;
  uuid: string;
  name: string;
  fromDate: string;
  toDate: string;
  isActive: boolean;
  sortOrder: number;
};

export type MonthsSavePayload = {
  name: string;
  fromDate: string;
  toDate: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type MonthsListFilters = { search?: string };
