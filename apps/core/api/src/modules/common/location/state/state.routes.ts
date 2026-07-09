import { stateLocationDefinition } from "../location.definitions.js";
import { createLocationRoutes } from "../shared/location.routes.js";

export const registerStateRoutes = createLocationRoutes(stateLocationDefinition);

