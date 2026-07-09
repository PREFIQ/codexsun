import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { workOrderTypesDefinition } from "./work-order-types.definition.js";
export const registerWorkOrderTypesRoutes = createCommonMasterRoutes(workOrderTypesDefinition);
