import { MasterRepository } from "../master.repository.js";
import { workOrderDefinition } from "./work-order.definition.js";
export class WorkOrderRepository extends MasterRepository { constructor() { super(workOrderDefinition); } }
