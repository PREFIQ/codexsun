import type { MasterDefinition } from "../../master/master.types";

export const companyDefinition: MasterDefinition = {
  apiPath: "/core/organisation/companies",
  description: "Company master with tax, communication, address, finance, and profile fields.",
  kind: "company",
  label: "Companies",
  route: "companies",
  search: "Search code, company, phone, email",
  singular: "company"
};
