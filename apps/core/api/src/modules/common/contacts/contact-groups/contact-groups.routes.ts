import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { contactGroupsDefinition } from "./contact-groups.definition.js";
export const registerContactGroupsRoutes = createCommonMasterRoutes(contactGroupsDefinition);
