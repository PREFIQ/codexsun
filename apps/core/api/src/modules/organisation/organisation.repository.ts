import { CompanyRepository } from "./company/company.repository.js";

export class OrganisationRepository {
  readonly companies = new CompanyRepository();
}
