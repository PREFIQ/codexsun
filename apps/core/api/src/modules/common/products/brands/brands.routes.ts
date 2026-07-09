import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { brandsDefinition } from "./brands.definition.js";
export const registerBrandsRoutes = createCommonMasterRoutes(brandsDefinition);
