import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { productGroupsDefinition } from "./product-groups.definition.js";
export const registerProductGroupsRoutes = createCommonMasterRoutes(productGroupsDefinition);
