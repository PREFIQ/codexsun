import { AppError } from "@codexsun/framework/errors";
import type { ContactProfile, ContactCreateInput, ContactUpdateInput } from "./contracts.js";
import type { ContactRepository } from "./repository.js";

export class ContactService {
  constructor(private readonly repository: ContactRepository) {}

  async list(tenantId: string): Promise<ContactProfile[]> {
    if (!tenantId) throw AppError.validation("tenantId is required");
    return this.repository.list(tenantId);
  }

  async getById(tenantId: string, contactId: string): Promise<ContactProfile> {
    const contact = await this.repository.getById(tenantId, contactId);
    if (!contact) throw AppError.notFound("Contact not found");
    return contact;
  }

  async create(input: ContactCreateInput): Promise<ContactProfile> {
    if (!input.tenantId) throw AppError.validation("tenantId is required");
    if (!input.displayName?.trim()) throw AppError.validation("displayName is required");
    const contact: ContactProfile = {
      contactId: crypto.randomUUID(),
      tenantId: input.tenantId,
      contactType: input.contactType,
      displayName: input.displayName,
      ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
      phone: input.phone ?? [],
      email: input.email ?? [],
      addresses: input.addresses ?? [],
      socialLinks: input.socialLinks ?? [],
      bankAccounts: input.bankAccounts ?? [],
      taxIdentities: input.taxIdentities ?? [],
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      status: "active",
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
      updatedBy: input.createdBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.create(contact);
    return contact;
  }

  async update(input: ContactUpdateInput): Promise<ContactProfile> {
    const existing = await this.getById(input.tenantId, input.contactId);
    const updated: ContactProfile = {
      ...existing,
      ...(input.contactType !== undefined ? { contactType: input.contactType } : {}),
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.companyName !== undefined ? { companyName: input.companyName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.addresses !== undefined ? { addresses: input.addresses } : {}),
      ...(input.socialLinks !== undefined ? { socialLinks: input.socialLinks } : {}),
      ...(input.bankAccounts !== undefined ? { bankAccounts: input.bankAccounts } : {}),
      ...(input.taxIdentities !== undefined ? { taxIdentities: input.taxIdentities } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      updatedBy: input.updatedBy,
      updatedAt: new Date().toISOString()
    };
    await this.repository.update(updated);
    return updated;
  }

  async archive(tenantId: string, contactId: string): Promise<void> {
    const existing = await this.getById(tenantId, contactId);
    if (existing.status === "archived") throw AppError.conflict("Contact is already archived");
    await this.repository.archive(tenantId, contactId);
  }

  async restore(tenantId: string, contactId: string): Promise<void> {
    const existing = await this.repository.getById(tenantId, contactId);
    if (!existing) throw AppError.notFound("Contact not found");
    if (existing.status === "active") throw AppError.conflict("Contact is already active");
    await this.repository.restore(tenantId, contactId);
  }
}
