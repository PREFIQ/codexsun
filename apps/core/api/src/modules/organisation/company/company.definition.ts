import type { MasterDefinition } from "../../master/foundation/master.types.js";

export const companyDefinition = {
  key: "company",
  label: "Companies",
  route: "companies",
  tableName: "companies",
  title: "Company"
} as const satisfies MasterDefinition;
