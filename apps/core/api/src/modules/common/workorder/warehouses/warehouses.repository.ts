import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { warehousesDefinition } from "./warehouses.definition.js";
export class WarehousesRepository extends CommonMasterRepository { constructor() { super(warehousesDefinition); } }
