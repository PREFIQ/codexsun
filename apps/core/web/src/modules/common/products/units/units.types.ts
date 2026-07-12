export type UnitsValue = boolean | number | string | null;
export type UnitsRecord = {
  id: number;
  isActive: boolean;
  [key: string]: UnitsValue;
};
export type UnitsField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type UnitsDefinition = {
  fields: UnitsField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const unitsDefinition: UnitsDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "products",
  key: "units",
  label: "Units",
  path: "/core/common/products/units",
  route: "core.common.products.units"
};
