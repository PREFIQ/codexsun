import { MasterRepository } from "../../master/master.repository.js";
import { companyDefinition } from "./company.definition.js";
export class CompanyRepository extends MasterRepository { constructor() { super(companyDefinition); } }
