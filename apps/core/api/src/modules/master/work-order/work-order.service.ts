import { MasterService } from "../master.service.js";
import { workOrderDefinition } from "./work-order.definition.js";
export class WorkOrderService extends MasterService { constructor() { super(workOrderDefinition); } }
