export type ProductAttribute = {
  attributeId: string;
  type: "brand" | "colour" | "size" | "style";
  value: string;
};

export type ProductItem = {
  itemId: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  groupCode?: string;
  categoryCode?: string;
  typeCode?: string;
  unitCode: string;
  hsnCode?: string;
  taxCategoryCode?: string;
  attributes: ProductAttribute[];
  status: "active" | "archived";
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ProductCreateInput = {
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  groupCode?: string;
  categoryCode?: string;
  typeCode?: string;
  unitCode: string;
  hsnCode?: string;
  taxCategoryCode?: string;
  attributes?: ProductAttribute[];
  createdBy: string;
};

export type ProductUpdateInput = {
  tenantId: string;
  itemId: string;
  name?: string;
  description?: string;
  groupCode?: string;
  categoryCode?: string;
  typeCode?: string;
  unitCode?: string;
  hsnCode?: string;
  taxCategoryCode?: string;
  attributes?: ProductAttribute[];
  updatedBy: string;
};

export const productPermissions = ["core.product.view", "core.product.manage"] as const;
export const productFeatureKey = "core" as const;
