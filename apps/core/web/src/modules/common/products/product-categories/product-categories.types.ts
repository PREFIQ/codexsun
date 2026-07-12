export type ProductCategoriesValue = boolean | number | string | null;
export type ProductCategoriesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: ProductCategoriesValue;
};
export type ProductCategoriesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type ProductCategoriesDefinition = {
  fields: ProductCategoriesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const productCategoriesDefinition: ProductCategoriesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "products",
  key: "productCategories",
  label: "Product Categories",
  path: "/core/common/products/product-categories",
  route: "core.common.products.product_categories"
};
