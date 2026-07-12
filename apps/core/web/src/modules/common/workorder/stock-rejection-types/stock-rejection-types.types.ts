export type StockRejectionTypesValue = boolean | number | string | null;
export type StockRejectionTypesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: StockRejectionTypesValue;
};
export type StockRejectionTypesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type StockRejectionTypesDefinition = {
  fields: StockRejectionTypesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const stockRejectionTypesDefinition: StockRejectionTypesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "workorder",
  key: "stockRejectionTypes",
  label: "Stock Rejection Types",
  path: "/core/common/workorder/stock-rejection-types",
  route: "core.common.workorder.stock_rejection_types"
};
