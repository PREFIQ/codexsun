export type CompanyChild = Record<string, boolean | number | string | null> & {
  id: number | string;
};
export type CompanyRecord = {
  id: number;
  code: string;
  name: string;
  legalName: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  gstin: string | null;
  pan: string | null;
  website: string | null;
  description: string | null;
  logoPath: string | null;
  logoDarkPath: string | null;
  industryId: number | null;
  industryName: string | null;
  status: "active" | "inactive" | "suspend";
  isActive: boolean;
  emails: CompanyChild[];
  phones: CompanyChild[];
  addresses: CompanyChild[];
  bankAccounts: CompanyChild[];
  socialLinks: CompanyChild[];
  createdAt: string;
  updatedAt: string;
};
export type CompanySavePayload = Partial<Omit<CompanyRecord, "id" | "createdAt" | "updatedAt">> & {
  name: string;
};
export type CompanyIndustry = { id: number; code: string; name: string };
export const companyDefinition = {
  apiPath: "/core/organisation/companies",
  description: "Company master with tax, communication, address, finance, and profile fields.",
  label: "Companies",
  search: "Search code, company, phone, email",
  singular: "company"
} as const;
