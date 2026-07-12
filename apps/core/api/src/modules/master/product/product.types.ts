export type ProductStatus = "active" | "inactive" | "suspend" | "deleted";

export type ProductRecord = {
  id: number;
  uuid: string;
  name: string;
  typeId: number | null;
  productCategoryId: number | null;
  hsnCodeId: number | null;
  unitId: number | null;
  taxId: number | null;
  openingStock: number;
  openingRate: number;
  status: ProductStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ProductSaveInput = Partial<
  Omit<ProductRecord, "id" | "uuid" | "createdAt" | "updatedAt" | "deletedAt">
> & { name: string };

export type ProductListFilters = { search?: string };
