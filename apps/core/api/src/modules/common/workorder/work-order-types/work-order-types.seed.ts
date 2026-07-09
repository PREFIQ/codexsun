import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { workOrderTypesDefinition } from "./work-order-types.definition.js";
export function seedWorkOrderTypes() { return seedCommonMaster(workOrderTypesDefinition); }
