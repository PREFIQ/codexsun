import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { contactGroupsDefinition } from "./contact-groups.definition.js";
export function seedContactGroups() { return seedCommonMaster(contactGroupsDefinition); }
