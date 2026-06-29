import type { AddressBlock } from "../../shared/address.js";
import type { PhoneBlock, EmailBlock } from "../../shared/contact-info.js";
import type { BankAccountBlock } from "../../shared/bank-account.js";
import type { TaxIdentityBlock } from "../../shared/tax-identity.js";

export type ContactType = "customer" | "supplier" | "transporter" | "employee" | "other";

export type ContactSocialLink = {
  platform: string;
  url: string;
};

export type ContactProfile = {
  contactId: string;
  tenantId: string;
  contactType: ContactType;
  displayName: string;
  companyName?: string;
  phone: PhoneBlock[];
  email: EmailBlock[];
  addresses: AddressBlock[];
  socialLinks: ContactSocialLink[];
  bankAccounts: BankAccountBlock[];
  taxIdentities: TaxIdentityBlock[];
  notes?: string;
  status: "active" | "archived";
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ContactCreateInput = {
  tenantId: string;
  contactType: ContactType;
  displayName: string;
  companyName?: string;
  phone?: PhoneBlock[];
  email?: EmailBlock[];
  addresses?: AddressBlock[];
  socialLinks?: ContactSocialLink[];
  bankAccounts?: BankAccountBlock[];
  taxIdentities?: TaxIdentityBlock[];
  notes?: string;
  createdBy: string;
};

export type ContactUpdateInput = {
  tenantId: string;
  contactId: string;
  contactType?: ContactType;
  displayName?: string;
  companyName?: string;
  phone?: PhoneBlock[];
  email?: EmailBlock[];
  addresses?: AddressBlock[];
  socialLinks?: ContactSocialLink[];
  bankAccounts?: BankAccountBlock[];
  taxIdentities?: TaxIdentityBlock[];
  notes?: string;
  updatedBy: string;
};

export const contactPermissions = ["core.contact.view", "core.contact.manage"] as const;
export const contactFeatureKey = "core" as const;
