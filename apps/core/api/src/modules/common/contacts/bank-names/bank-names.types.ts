export type BankNamesRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type BankNamesSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type BankNamesListFilters = { search?: string };
