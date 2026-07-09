import { CommonMasterService } from "../../foundation/common-master.service.js";
import { taxesDefinition } from "./taxes.definition.js";
export class TaxesService extends CommonMasterService { constructor() { super(taxesDefinition); } }
