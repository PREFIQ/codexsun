export type PrioritiesValue = boolean | number | string | null;
export type PrioritiesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: PrioritiesValue;
};
export type PrioritiesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type PrioritiesDefinition = {
  fields: PrioritiesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const prioritiesDefinition: PrioritiesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    },
    {
      key: "colour",
      label: "Colour",
      type: "color",
      required: true
    },
    {
      key: "tag",
      label: "Tag",
      type: "string",
      required: true
    }
  ],
  group: "others",
  key: "priorities",
  label: "Priorities",
  path: "/core/common/others/priorities",
  route: "core.common.others.priorities"
};
