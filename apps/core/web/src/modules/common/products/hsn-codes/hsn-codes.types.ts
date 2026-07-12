export type HsnCodesValue = boolean | number | string | null;
export type HsnCodesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: HsnCodesValue;
};
export type HsnCodesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type HsnCodesDefinition = {
  fields: HsnCodesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const hsnCodesDefinition: HsnCodesDefinition = {
  fields: [
    {
      key: "code",
      label: "Code",
      type: "string",
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
  key: "hsnCodes",
  label: "HSN Codes",
  path: "/core/common/products/hsn-codes",
  route: "core.common.products.hsn_codes"
};
