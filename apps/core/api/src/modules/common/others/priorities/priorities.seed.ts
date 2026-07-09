import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { prioritiesDefinition } from "./priorities.definition.js";
export function seedPriorities() { return seedCommonMaster(prioritiesDefinition); }
