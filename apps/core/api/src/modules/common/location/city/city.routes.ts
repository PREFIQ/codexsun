import { cityLocationDefinition } from "../location.definitions.js";
import { createLocationRoutes } from "../shared/location.routes.js";

export const registerCityRoutes = createLocationRoutes(cityLocationDefinition);

