export type TransportsValue = boolean | number | string | null;
export type TransportsRecord = {
  id: number;
  isActive: boolean;
  [key: string]: TransportsValue;
};
export type TransportsField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type TransportsDefinition = {
  fields: TransportsField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const transportsDefinition: TransportsDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    },
    {
      key: "gst",
      label: "GST",
      type: "string",
      required: false
    },
    {
      key: "vehicleNo",
      label: "Vehicle number",
      type: "string",
      required: false
    },
    {
      key: "address",
      label: "Address",
      type: "string",
      required: false
    },
    {
      key: "contactNo",
      label: "Contact number",
      type: "string",
      required: false
    },
    {
      key: "contactPerson",
      label: "Contact person",
      type: "string",
      required: false
    }
  ],
  group: "workorder",
  key: "transports",
  label: "Transports",
  path: "/core/common/workorder/transports",
  route: "core.common.workorder.transports"
};
