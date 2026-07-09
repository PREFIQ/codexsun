import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { prioritiesDefinition } from "./priorities.definition.js";
export const registerPrioritiesRoutes = createCommonMasterRoutes(prioritiesDefinition);
