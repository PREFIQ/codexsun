import { MasterService } from "../../master/master.service.js";
import { companyDefinition } from "./company.definition.js";
export class CompanyService extends MasterService { constructor() { super(companyDefinition); } }
