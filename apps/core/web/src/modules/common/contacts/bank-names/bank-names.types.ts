export type BankNamesValue = boolean | number | string | null;
export type BankNamesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: BankNamesValue;
};
export type BankNamesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type BankNamesDefinition = {
  fields: BankNamesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const bankNamesDefinition: BankNamesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "contacts",
  key: "bankNames",
  label: "Bank Names",
  path: "/core/common/contacts/bank-names",
  route: "core.common.contacts.bank_names"
};
