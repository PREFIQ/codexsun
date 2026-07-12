export type CurrenciesValue = boolean | number | string | null;
export type CurrenciesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: CurrenciesValue;
};
export type CurrenciesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type CurrenciesDefinition = {
  fields: CurrenciesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const currenciesDefinition: CurrenciesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    },
    {
      key: "symbol",
      label: "Symbol",
      type: "string",
      required: true
    }
  ],
  group: "others",
  key: "currencies",
  label: "Currencies",
  path: "/core/common/others/currencies",
  route: "core.common.others.currencies"
};
