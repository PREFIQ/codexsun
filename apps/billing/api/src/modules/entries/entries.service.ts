import { AppError } from "@codexsun/framework/errors";
import { EntriesRepository } from "./entries.repository.js";
import type { CommentCreateInput, EntryContactRecord, EntryFilters, EntryKind, EntryProductRecord, EntryUpsertInput } from "./entries.types.js";

export class EntriesService {
  private readonly repository = new EntriesRepository();

  listContacts(tenantId: string) {
    return this.repository.listContacts(tenantId);
  }

  createContact(tenantId: string, input: Partial<EntryContactRecord>) {
    return this.repository.createContact(tenantId, input);
  }

  updateContact(tenantId: string, id: string, input: Partial<EntryContactRecord>) {
    return this.repository.updateContact(tenantId, id, input);
  }

  listProducts(tenantId: string) {
    return this.repository.listProducts(tenantId);
  }

  createProduct(tenantId: string, input: Partial<EntryProductRecord>) {
    return this.repository.createProduct(tenantId, input);
  }

  updateProduct(tenantId: string, id: string, input: Partial<EntryProductRecord>) {
    return this.repository.updateProduct(tenantId, id, input);
  }

  listEntries(kind: EntryKind, tenantId: string, filters: EntryFilters) {
    return this.repository.listEntries(kind, tenantId, filters);
  }

  async findEntry(kind: EntryKind, tenantId: string, id: string) {
    const entry = await this.repository.findEntry(kind, tenantId, id);
    if (!entry) throw AppError.notFound(`${labelFor(kind)} not found.`);
    return entry;
  }

  createEntry(kind: EntryKind, tenantId: string, input: EntryUpsertInput) {
    return this.repository.createEntry(kind, tenantId, input);
  }

  updateEntry(kind: EntryKind, tenantId: string, id: string, input: EntryUpsertInput) {
    return this.repository.updateEntry(kind, tenantId, id, input);
  }

  setEntryActive(kind: EntryKind, tenantId: string, id: string, isActive: boolean) {
    return this.repository.setEntryActive(kind, tenantId, id, isActive);
  }

  addComment(kind: EntryKind, tenantId: string, id: string, input: CommentCreateInput) {
    return this.repository.addComment(kind, tenantId, id, input);
  }

}

function labelFor(kind: EntryKind) {
  if (kind === "sales") return "Sales";
  if (kind === "purchase") return "Purchase";
  return "Export Sales";
}
