import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { warehousesDefinition } from "./warehouses.definition.js";
export function seedWarehouses() { return seedCommonMaster(warehousesDefinition); }
