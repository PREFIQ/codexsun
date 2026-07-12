export type ProductTypesValue = boolean | number | string | null;
export type ProductTypesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: ProductTypesValue;
};
export type ProductTypesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type ProductTypesDefinition = {
  fields: ProductTypesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const productTypesDefinition: ProductTypesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "products",
  key: "productTypes",
  label: "Product Types",
  path: "/core/common/products/product-types",
  route: "core.common.products.product_types"
};
