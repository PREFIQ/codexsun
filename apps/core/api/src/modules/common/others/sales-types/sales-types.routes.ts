import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { salesTypesDefinition } from "./sales-types.definition.js";
export const registerSalesTypesRoutes = createCommonMasterRoutes(salesTypesDefinition);
