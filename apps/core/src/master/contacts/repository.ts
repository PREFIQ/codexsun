import type { ContactProfile } from "./contracts.js";

export interface ContactRepository {
  list(tenantId: string): Promise<ContactProfile[]>;
  getById(tenantId: string, contactId: string): Promise<ContactProfile | null>;
  create(contact: ContactProfile): Promise<void>;
  update(contact: ContactProfile): Promise<void>;
  archive(tenantId: string, contactId: string): Promise<void>;
  restore(tenantId: string, contactId: string): Promise<void>;
}

export class InMemoryContactRepository implements ContactRepository {
  private contacts: ContactProfile[] = [];

  async list(tenantId: string): Promise<ContactProfile[]> {
    return this.contacts
      .filter((c) => c.tenantId === tenantId && !c.deletedAt)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getById(tenantId: string, contactId: string): Promise<ContactProfile | null> {
    return this.contacts.find((c) => c.contactId === contactId && c.tenantId === tenantId) ?? null;
  }

  async create(contact: ContactProfile): Promise<void> {
    this.contacts.push(contact);
  }

  async update(contact: ContactProfile): Promise<void> {
    const idx = this.contacts.findIndex((c) => c.contactId === contact.contactId && c.tenantId === contact.tenantId);
    if (idx !== -1) this.contacts[idx] = contact;
  }

  async archive(tenantId: string, contactId: string): Promise<void> {
    const contact = await this.getById(tenantId, contactId);
    if (contact) {
      contact.status = "archived";
      contact.deletedAt = new Date().toISOString();
    }
  }

  async restore(tenantId: string, contactId: string): Promise<void> {
    const contact = this.contacts.find((c) => c.contactId === contactId && c.tenantId === tenantId);
    if (contact) {
      contact.status = "active";
      delete contact.deletedAt;
    }
  }
}
