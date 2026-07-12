export type DestinationsValue = boolean | number | string | null;
export type DestinationsRecord = {
  id: number;
  isActive: boolean;
  [key: string]: DestinationsValue;
};
export type DestinationsField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type DestinationsDefinition = {
  fields: DestinationsField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const destinationsDefinition: DestinationsDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "workorder",
  key: "destinations",
  label: "Destinations",
  path: "/core/common/workorder/destinations",
  route: "core.common.workorder.destinations"
};
