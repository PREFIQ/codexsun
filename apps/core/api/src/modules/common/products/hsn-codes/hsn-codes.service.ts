import { CommonMasterService } from "../../foundation/common-master.service.js";
import { hsnCodesDefinition } from "./hsn-codes.definition.js";
export class HsnCodesService extends CommonMasterService { constructor() { super(hsnCodesDefinition); } }
