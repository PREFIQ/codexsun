import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { salesTypesDefinition } from "./sales-types.definition.js";
export class SalesTypesRepository extends CommonMasterRepository { constructor() { super(salesTypesDefinition); } }
