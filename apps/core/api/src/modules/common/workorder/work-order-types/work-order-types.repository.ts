import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { workOrderTypesDefinition } from "./work-order-types.definition.js";
export class WorkOrderTypesRepository extends CommonMasterRepository { constructor() { super(workOrderTypesDefinition); } }
