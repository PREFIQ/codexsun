export type ContactChild = Record<string, boolean | number | string | null> & {
  id: number | string;
};
export type ContactRecord = {
  id: number;
  uuid: string | null;
  code: string;
  name: string;
  legalName: string | null;
  typeId: number | null;
  typeName: string | null;
  groupId: number | null;
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
  status: "active" | "inactive" | "suspend" | "deleted";
  isActive: boolean;
  emails: ContactChild[];
  phones: ContactChild[];
  addresses: ContactChild[];
  bankAccounts: ContactChild[];
  socialLinks: ContactChild[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
export type ContactSavePayload = Partial<
  Omit<ContactRecord, "id" | "uuid" | "createdAt" | "updatedAt" | "deletedAt">
> & { name: string };
export const contactDefinition = {
  description:
    "Contact master with owned tax, communication, address, finance, and lifecycle fields.",
  label: "Contacts",
  search: "Search code, contact, phone, or email",
  singular: "contact"
} as const;
