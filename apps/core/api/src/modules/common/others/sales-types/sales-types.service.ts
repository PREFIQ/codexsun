import { CommonMasterService } from "../../foundation/common-master.service.js";
import { salesTypesDefinition } from "./sales-types.definition.js";
export class SalesTypesService extends CommonMasterService { constructor() { super(salesTypesDefinition); } }
