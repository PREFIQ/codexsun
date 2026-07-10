import { MasterService } from "../../master/master.service.js";
import { companyDefinition } from "./company.definition.js";
import { CompanyRepository } from "./company.repository.js";
import type { MasterSaveInput } from "../../master/foundation/master.types.js";
export class CompanyService extends MasterService {
  private readonly companyRepository = new CompanyRepository();
  constructor() { super(companyDefinition); }
  create(tenantId: string, input: MasterSaveInput) { return this.companyRepository.create(tenantId, input); }
  update(tenantId: string, id: string, input: MasterSaveInput) { return this.companyRepository.update(tenantId, id, input); }
  listIndustries() { return this.companyRepository.listIndustries(); }
}
