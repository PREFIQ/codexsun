import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { taxesDefinition } from "./taxes.definition.js";
export function seedTaxes() { return seedCommonMaster(taxesDefinition); }
