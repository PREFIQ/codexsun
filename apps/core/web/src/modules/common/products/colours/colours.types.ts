export type ColoursValue = boolean | number | string | null;
export type ColoursRecord = {
  id: number;
  isActive: boolean;
  [key: string]: ColoursValue;
};
export type ColoursField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type ColoursDefinition = {
  fields: ColoursField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const coloursDefinition: ColoursDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "color",
      required: true
    }
  ],
  group: "products",
  key: "colours",
  label: "Colours",
  path: "/core/common/products/colours",
  route: "core.common.products.colours"
};
