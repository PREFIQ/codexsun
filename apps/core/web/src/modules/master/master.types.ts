export type MasterKind = "company" | "contact" | "product" | "work-order";

export type MasterChild = Record<string, boolean | number | string | null> & { id: string };

export type MasterRecord = {
  id: string;
  uuid: string;
  tenantId: string;
  code: string;
  name: string;
  legalName: string | null;
  typeId: string | null;
  typeName: string | null;
  groupId: string | null;
  groupName: string | null;
  primaryPhone: string | null;
  primaryEmail: string | null;
  gstin: string | null;
  pan: string | null;
  msmeNo: string | null;
  msmeCategory: string | null;
  tanNo: string | null;
  tdsAvailable: boolean;
  tcsAvailable: boolean;
  openingBalance: number;
  creditLimit: number;
  website: string | null;
  description: string | null;
  productCategoryId: string | null;
  productCategoryName: string | null;
  unitId: string | null;
  unitName: string | null;
  hsnCodeId: string | null;
  hsnCode: string | null;
  taxId: string | null;
  taxName: string | null;
  openingStock: number;
  openingRate: number;
  status: "active" | "not_active" | "suspend";
  isActive: boolean;
  emails: MasterChild[];
  phones: MasterChild[];
  addresses: MasterChild[];
  bankAccounts: MasterChild[];
  socialLinks: MasterChild[];
  createdAt: string;
  updatedAt: string;
};

export type MasterSavePayload = Partial<Omit<MasterRecord, "id" | "uuid" | "tenantId" | "createdAt" | "updatedAt">>;

export type MasterDefinition = {
  apiPath?: string;
  description: string;
  kind: MasterKind;
  label: string;
  route: string;
  search: string;
  singular: string;
};
