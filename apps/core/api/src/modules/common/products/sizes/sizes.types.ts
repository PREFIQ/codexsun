export type SizesRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type SizesSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type SizesListFilters = { search?: string };
