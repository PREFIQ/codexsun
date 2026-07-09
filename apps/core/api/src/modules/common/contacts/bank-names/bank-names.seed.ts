import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { bankNamesDefinition } from "./bank-names.definition.js";
export function seedBankNames() { return seedCommonMaster(bankNamesDefinition); }
