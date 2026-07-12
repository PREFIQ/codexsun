export type ColoursRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type ColoursSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type ColoursListFilters = { search?: string };
