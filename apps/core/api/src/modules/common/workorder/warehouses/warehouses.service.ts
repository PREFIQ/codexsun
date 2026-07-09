import { CommonMasterService } from "../../foundation/common-master.service.js";
import { warehousesDefinition } from "./warehouses.definition.js";
export class WarehousesService extends CommonMasterService { constructor() { super(warehousesDefinition); } }
