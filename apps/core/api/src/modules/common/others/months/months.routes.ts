import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { monthsDefinition } from "./months.definition.js";
export const registerMonthsRoutes = createCommonMasterRoutes(monthsDefinition);
