import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { unitsDefinition } from "./units.definition.js";
export function seedUnits() { return seedCommonMaster(unitsDefinition); }
