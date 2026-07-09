import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { sizesDefinition } from "./sizes.definition.js";
export const registerSizesRoutes = createCommonMasterRoutes(sizesDefinition);
