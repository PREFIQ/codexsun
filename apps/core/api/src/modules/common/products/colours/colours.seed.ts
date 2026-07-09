import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { coloursDefinition } from "./colours.definition.js";
export function seedColours() { return seedCommonMaster(coloursDefinition); }
