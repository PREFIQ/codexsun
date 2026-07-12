export type WarehousesValue = boolean | number | string | null;
export type WarehousesRecord = {
  id: number;
  isActive: boolean;
  [key: string]: WarehousesValue;
};
export type WarehousesField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type WarehousesDefinition = {
  fields: WarehousesField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};

export const warehousesDefinition: WarehousesDefinition = {
  fields: [
    {
      key: "name",
      label: "Name",
      type: "string",
      required: true
    }
  ],
  group: "workorder",
  key: "warehouses",
  label: "Warehouses",
  path: "/core/common/workorder/warehouses",
  route: "core.common.workorder.warehouses"
};
