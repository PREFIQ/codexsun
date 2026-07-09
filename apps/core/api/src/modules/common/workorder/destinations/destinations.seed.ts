import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { destinationsDefinition } from "./destinations.definition.js";
export function seedDestinations() { return seedCommonMaster(destinationsDefinition); }
