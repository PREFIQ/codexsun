import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { hsnCodesDefinition } from "./hsn-codes.definition.js";
export function seedHsnCodes() { return seedCommonMaster(hsnCodesDefinition); }
