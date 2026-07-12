export type ProductCategoriesRecord = {
  id: string;
  uuid: string;
  name: string;
  isActive: boolean;
  sortOrder: number;
};

export type ProductCategoriesSavePayload = {
  name: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type ProductCategoriesListFilters = { search?: string };
