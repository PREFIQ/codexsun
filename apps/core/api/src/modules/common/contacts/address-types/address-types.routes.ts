import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { addressTypesDefinition } from "./address-types.definition.js";
export const registerAddressTypesRoutes = createCommonMasterRoutes(addressTypesDefinition);
