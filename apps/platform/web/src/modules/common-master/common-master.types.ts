export type CommonMasterValue = boolean | number | string | null;
export type CommonMasterRecord = {
  id: string;
  isActive: boolean;
  tenantId: string;
  uuid: string;
  [key: string]: CommonMasterValue;
};
export type CommonMasterField = {
  key: string;
  label: string;
  required?: boolean;
  type: "boolean" | "color" | "date" | "number" | "string";
};
export type CommonMasterDefinition = {
  fields: CommonMasterField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  route: string;
};
