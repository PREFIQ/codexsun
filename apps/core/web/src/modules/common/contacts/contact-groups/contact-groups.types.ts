export type ContactGroupsValue = boolean | number | string | null;
export type ContactGroupsRecord = {
  id: number;
  isActive: boolean;
  [key: string]: ContactGroupsValue;
};
export type ContactGroupsField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type ContactGroupsDefinition = {
  fields: ContactGroupsField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const contactGroupsDefinition: ContactGroupsDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "contacts",
  key: "contactGroups",
  label: "Contact Groups",
  path: "/core/common/contacts/contact-groups",
  route: "core.common.contacts.contact_groups"
};
