export type CurrenciesRecord = {
  id: string;
  uuid: string;
  name: string;
  symbol: string;
  isActive: boolean;
  sortOrder: number;
};

export type CurrenciesSavePayload = {
  name: string;
  symbol: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type CurrenciesListFilters = { search?: string };
