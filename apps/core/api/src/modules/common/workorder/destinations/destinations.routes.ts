import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { destinationsDefinition } from "./destinations.definition.js";
export const registerDestinationsRoutes = createCommonMasterRoutes(destinationsDefinition);
