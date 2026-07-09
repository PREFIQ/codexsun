import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { stockRejectionTypesDefinition } from "./stock-rejection-types.definition.js";
export class StockRejectionTypesRepository extends CommonMasterRepository { constructor() { super(stockRejectionTypesDefinition); } }
