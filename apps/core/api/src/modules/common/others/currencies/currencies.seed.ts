import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { currenciesDefinition } from "./currencies.definition.js";
export function seedCurrencies() { return seedCommonMaster(currenciesDefinition); }
