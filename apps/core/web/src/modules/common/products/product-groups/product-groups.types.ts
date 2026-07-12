export type ProductGroupsValue = boolean | number | string | null;
export type ProductGroupsRecord = {
  id: number;
  isActive: boolean;
  [key: string]: ProductGroupsValue;
};
export type ProductGroupsField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type ProductGroupsDefinition = {
  fields: ProductGroupsField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const productGroupsDefinition: ProductGroupsDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "products",
  key: "productGroups",
  label: "Product Groups",
  path: "/core/common/products/product-groups",
  route: "core.common.products.product_groups"
};
