import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { brandsDefinition } from "./brands.definition.js";
export function seedBrands() { return seedCommonMaster(brandsDefinition); }
