import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { productTypesDefinition } from "./product-types.definition.js";
export const registerProductTypesRoutes = createCommonMasterRoutes(productTypesDefinition);
