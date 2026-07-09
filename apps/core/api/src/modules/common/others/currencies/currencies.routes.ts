import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { currenciesDefinition } from "./currencies.definition.js";
export const registerCurrenciesRoutes = createCommonMasterRoutes(currenciesDefinition);
