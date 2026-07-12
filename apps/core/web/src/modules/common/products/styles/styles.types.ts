export type StylesValue = boolean | number | string | null;
export type StylesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: StylesValue;
};
export type StylesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type StylesDefinition = {
  fields: StylesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const stylesDefinition: StylesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "products",
  key: "styles",
  label: "Styles",
  path: "/core/common/products/styles",
  route: "core.common.products.styles"
};
