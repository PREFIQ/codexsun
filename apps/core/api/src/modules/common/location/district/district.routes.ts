import { districtLocationDefinition } from "../location.definitions.js";
import { createLocationRoutes } from "../shared/location.routes.js";

export const registerDistrictRoutes = createLocationRoutes(districtLocationDefinition);

