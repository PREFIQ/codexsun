import { CompanyService } from "./company/company.service.js";

export class OrganisationService {
  readonly companies = new CompanyService();
}
