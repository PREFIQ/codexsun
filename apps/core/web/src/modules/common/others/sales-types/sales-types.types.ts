export type SalesTypesValue = boolean | number | string | null;
export type SalesTypesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: SalesTypesValue;
};
export type SalesTypesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type SalesTypesDefinition = {
  fields: SalesTypesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const salesTypesDefinition: SalesTypesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    },
    {
      key: "description",
      label: "Description",
      type: "string",
      required: false
    }
  ],
  group: "others",
  key: "salesTypes",
  label: "Sales Types",
  path: "/core/common/others/sales-types",
  route: "core.common.others.sales_types"
};
