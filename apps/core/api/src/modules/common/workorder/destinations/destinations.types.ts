export type DestinationsRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type DestinationsSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type DestinationsListFilters = { search?: string };
