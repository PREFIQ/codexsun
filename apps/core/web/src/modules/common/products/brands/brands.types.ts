export type BrandsValue = boolean | number | string | null;
export type BrandsRecord = {
  id: number;
  isActive: boolean;
  [key: string]: BrandsValue;
};
export type BrandsField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type BrandsDefinition = {
  fields: BrandsField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const brandsDefinition: BrandsDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "products",
  key: "brands",
  label: "Brands",
  path: "/core/common/products/brands",
  route: "core.common.products.brands"
};
