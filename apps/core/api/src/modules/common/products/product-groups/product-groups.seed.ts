import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { productGroupsDefinition } from "./product-groups.definition.js";
export function seedProductGroups() { return seedCommonMaster(productGroupsDefinition); }
