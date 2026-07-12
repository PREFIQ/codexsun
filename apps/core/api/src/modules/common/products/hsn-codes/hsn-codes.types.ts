export type HsnCodesRecord = {
  id: string;
  uuid: string;
  code: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
};

export type HsnCodesSavePayload = {
  code: string;
  description: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type HsnCodesListFilters = { search?: string };
