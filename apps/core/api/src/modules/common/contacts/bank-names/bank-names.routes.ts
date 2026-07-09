import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { bankNamesDefinition } from "./bank-names.definition.js";
export const registerBankNamesRoutes = createCommonMasterRoutes(bankNamesDefinition);
