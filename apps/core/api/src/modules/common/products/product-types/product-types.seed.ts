import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { productTypesDefinition } from "./product-types.definition.js";
export function seedProductTypes() { return seedCommonMaster(productTypesDefinition); }
