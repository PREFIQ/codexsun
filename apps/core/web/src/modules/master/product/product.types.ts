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
  status: "active" | "inactive" | "suspend" | "deleted";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
export type ProductSavePayload = Partial<
  Omit<ProductRecord, "id" | "uuid" | "createdAt" | "updatedAt" | "deletedAt">
> & { name: string };
