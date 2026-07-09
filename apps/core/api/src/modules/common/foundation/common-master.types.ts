export type CommonMasterFieldType = "boolean" | "date" | "number" | "string";

export type CommonMasterField = {
  column: string;
  key: string;
  label: string;
  required?: boolean;
  type: CommonMasterFieldType;
};

export type CommonMasterSeed = Record<string, boolean | number | string | null>;

export type CommonMasterDefinition = {
  fields: CommonMasterField[];
  group: "contacts" | "others" | "products" | "workorder";
  key: string;
  label: string;
  path: string;
  seeds: CommonMasterSeed[];
  tableName: string;
};

export type CommonMasterRecord = {
  id: string;
  isActive: boolean;
  tenantId: string;
  uuid: string;
  [key: string]: boolean | number | string | null;
};
