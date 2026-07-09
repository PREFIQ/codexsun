import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { productCategoriesDefinition } from "./product-categories.definition.js";
export const registerProductCategoriesRoutes = createCommonMasterRoutes(productCategoriesDefinition);
