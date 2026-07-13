import { CompanyRepository } from "./company.repository.js";
import type { CompanySaveInput } from "./company.types.js";
export class CompanyService {
  constructor(private readonly repository = new CompanyRepository()) {}
  list(search = "") {
    return this.repository.list(search);
  }
  find(id: string) {
    return this.repository.find(id);
  }
  create(input: CompanySaveInput) {
    return this.repository.create(input);
  }
  update(id: string, input: CompanySaveInput) {
    return this.repository.update(id, input);
  }
  setActive(id: string, active: boolean) {
    return this.repository.setActive(id, active);
  }
  forceDelete(id: string) {
    return this.repository.forceDelete(id);
  }
  listIndustries() {
    return this.repository.listIndustries();
  }
}
