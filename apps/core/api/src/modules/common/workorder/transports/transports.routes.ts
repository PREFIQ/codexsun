import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { transportsDefinition } from "./transports.definition.js";
export const registerTransportsRoutes = createCommonMasterRoutes(transportsDefinition);
