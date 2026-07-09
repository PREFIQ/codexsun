import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { unitsDefinition } from "./units.definition.js";
export const registerUnitsRoutes = createCommonMasterRoutes(unitsDefinition);
