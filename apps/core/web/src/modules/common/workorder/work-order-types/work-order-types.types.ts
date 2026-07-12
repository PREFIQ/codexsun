export type WorkOrderTypesValue = boolean | number | string | null;
export type WorkOrderTypesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: WorkOrderTypesValue;
};
export type WorkOrderTypesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type WorkOrderTypesDefinition = {
  fields: WorkOrderTypesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const workOrderTypesDefinition: WorkOrderTypesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "workorder",
  key: "workOrderTypes",
  label: "Work Order Types",
  path: "/core/common/workorder/work-order-types",
  route: "core.common.workorder.work_order_types"
};
