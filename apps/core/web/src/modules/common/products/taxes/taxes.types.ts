export type TaxesValue = boolean | number | string | null;
export type TaxesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: TaxesValue;
};
export type TaxesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type TaxesDefinition = {
  fields: TaxesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const taxesDefinition: TaxesDefinition = {
  fields: [
    {
      key: "ratePercent",
      label: "Rate percent",
      type: "number",
      required: true
    },
    {
      key: "description",
      label: "Description",
      type: "string",
      required: true
    }
  ],
  group: "products",
  key: "taxes",
  label: "Taxes",
  path: "/core/common/products/taxes",
  route: "core.common.products.taxes"
};
