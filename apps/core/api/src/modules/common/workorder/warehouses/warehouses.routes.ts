import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { warehousesDefinition } from "./warehouses.definition.js";
export const registerWarehousesRoutes = createCommonMasterRoutes(warehousesDefinition);
