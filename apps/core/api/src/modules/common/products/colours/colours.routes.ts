import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { coloursDefinition } from "./colours.definition.js";
export const registerColoursRoutes = createCommonMasterRoutes(coloursDefinition);
