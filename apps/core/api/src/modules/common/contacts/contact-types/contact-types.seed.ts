import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { contactTypesDefinition } from "./contact-types.definition.js";
export function seedContactTypes() { return seedCommonMaster(contactTypesDefinition); }
