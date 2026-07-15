export type TransformField = {
  sourceField: string;
  targetField: string;
};

export type TransformTable = {
  sourceTable: string;
  targetTable: string;
  group: string;
  fields: TransformField[];
  sourceQuery: string;
  targetQuery: string;
};

export type TransformPlan = {
  id: number;
  mappingPlanId: number;
  name: string;
  status: "draft" | "approved";
  tables: TransformTable[];
  createdAt: string;
  updatedAt: string;
  approvedAt?: string | null;
};
