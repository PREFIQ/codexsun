import { ContactRepository } from "./contact.repository.js";
import type { ContactListFilters, ContactSaveInput } from "./contact.types.js";
export class ContactService {
  constructor(private readonly repository = new ContactRepository()) {}
  list(filters: ContactListFilters = {}) {
    return this.repository.list(filters.search ?? "");
  }
  find(id: string) {
    return this.repository.find(id);
  }
  create(input: ContactSaveInput) {
    return this.repository.create(input);
  }
  update(id: string, input: ContactSaveInput) {
    return this.repository.update(id, input);
  }
  setActive(id: string, active: boolean) {
    return this.repository.setActive(id, active);
  }
  forceDelete(id: string) {
    return this.repository.forceDelete(id);
  }
}
