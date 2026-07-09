import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { transportsDefinition } from "./transports.definition.js";
export function seedTransports() { return seedCommonMaster(transportsDefinition); }
