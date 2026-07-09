import { CommonMasterService } from "../../foundation/common-master.service.js";
import { stockRejectionTypesDefinition } from "./stock-rejection-types.definition.js";
export class StockRejectionTypesService extends CommonMasterService { constructor() { super(stockRejectionTypesDefinition); } }
