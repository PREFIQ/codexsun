export type AddressTypesValue = boolean | number | string | null;
export type AddressTypesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: AddressTypesValue;
};
export type AddressTypesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type AddressTypesDefinition = {
  fields: AddressTypesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const addressTypesDefinition: AddressTypesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "contacts",
  key: "addressTypes",
  label: "Address Types",
  path: "/core/common/contacts/address-types",
  route: "core.common.contacts.address_types"
};
