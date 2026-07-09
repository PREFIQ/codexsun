import { CommonMasterService } from "../../foundation/common-master.service.js";
import { workOrderTypesDefinition } from "./work-order-types.definition.js";
export class WorkOrderTypesService extends CommonMasterService { constructor() { super(workOrderTypesDefinition); } }
