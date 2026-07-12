export type SizesValue = boolean | number | string | null;
export type SizesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: SizesValue;
};
export type SizesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type SizesDefinition = {
  fields: SizesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const sizesDefinition: SizesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "products",
  key: "sizes",
  label: "Sizes",
  path: "/core/common/products/sizes",
  route: "core.common.products.sizes"
};
