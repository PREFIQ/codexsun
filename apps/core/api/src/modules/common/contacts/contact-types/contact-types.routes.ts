import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { contactTypesDefinition } from "./contact-types.definition.js";
export const registerContactTypesRoutes = createCommonMasterRoutes(contactTypesDefinition);
