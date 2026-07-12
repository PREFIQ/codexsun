export type MonthsValue = boolean | number | string | null;
export type MonthsRecord = {
  id: number;
  isActive: boolean;
  [key: string]: MonthsValue;
};
export type MonthsField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type MonthsDefinition = {
  fields: MonthsField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const monthsDefinition: MonthsDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    },
    {
      key: "startDate",
      label: "Start date",
      type: "date",
      required: true
    },
    {
      key: "endDate",
      label: "End date",
      type: "date",
      required: true
    }
  ],
  group: "others",
  key: "months",
  label: "Months",
  path: "/core/common/others/months",
  route: "core.common.others.months"
};
