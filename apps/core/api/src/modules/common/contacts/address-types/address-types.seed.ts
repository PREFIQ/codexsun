import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { addressTypesDefinition } from "./address-types.definition.js";
export function seedAddressTypes() { return seedCommonMaster(addressTypesDefinition); }
