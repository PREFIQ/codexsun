import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { monthsDefinition } from "./months.definition.js";
export function seedMonths() { return seedCommonMaster(monthsDefinition); }
