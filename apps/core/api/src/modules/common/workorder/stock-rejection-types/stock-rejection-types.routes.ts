import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { stockRejectionTypesDefinition } from "./stock-rejection-types.definition.js";
export const registerStockRejectionTypesRoutes = createCommonMasterRoutes(stockRejectionTypesDefinition);
