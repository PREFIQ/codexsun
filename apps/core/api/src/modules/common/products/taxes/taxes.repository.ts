import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { taxesDefinition } from "./taxes.definition.js";
export class TaxesRepository extends CommonMasterRepository { constructor() { super(taxesDefinition); } }
