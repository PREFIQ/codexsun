import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { stockRejectionTypesDefinition } from "./stock-rejection-types.definition.js";
export function seedStockRejectionTypes() { return seedCommonMaster(stockRejectionTypesDefinition); }
