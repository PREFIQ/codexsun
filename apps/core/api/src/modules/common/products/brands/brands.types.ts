export type BrandsRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type BrandsSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type BrandsListFilters = { search?: string };
