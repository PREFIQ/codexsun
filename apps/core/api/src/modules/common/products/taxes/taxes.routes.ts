import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { taxesDefinition } from "./taxes.definition.js";
export const registerTaxesRoutes = createCommonMasterRoutes(taxesDefinition);
