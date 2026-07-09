import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { salesTypesDefinition } from "./sales-types.definition.js";
export function seedSalesTypes() { return seedCommonMaster(salesTypesDefinition); }
