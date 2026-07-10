import type { MasterDefinition } from "../../master/foundation/master.types.js";

export const companyDefinition = {
  key: "company",
  label: "Companies",
  route: "companies",
  tableName: "core_master_companies",
  title: "Company"
} as const satisfies MasterDefinition;
