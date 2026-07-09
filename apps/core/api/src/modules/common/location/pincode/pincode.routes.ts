import { pincodeLocationDefinition } from "../location.definitions.js";
import { createLocationRoutes } from "../shared/location.routes.js";

export const registerPincodeRoutes = createLocationRoutes(pincodeLocationDefinition);

