import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { hsnCodesDefinition } from "./hsn-codes.definition.js";
export class HsnCodesRepository extends CommonMasterRepository { constructor() { super(hsnCodesDefinition); } }
