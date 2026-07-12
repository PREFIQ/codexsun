export type ContactTypesValue = boolean | number | string | null;
export type ContactTypesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: ContactTypesValue;
};
export type ContactTypesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type ContactTypesDefinition = {
  fields: ContactTypesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const contactTypesDefinition: ContactTypesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "contacts",
  key: "contactTypes",
  label: "Contact Types",
  path: "/core/common/contacts/contact-types",
  route: "core.common.contacts.contact_types"
};
