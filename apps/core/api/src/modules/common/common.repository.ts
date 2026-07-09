import { locationModules } from "./location/location.module.js";
import type { CommonModuleRegistration } from "./common.types.js";

export class CommonRepository {
  listRegisteredAreas(): CommonModuleRegistration[] {
    return [
      {
        area: "location",
        moduleKeys: locationModules.map((module) => module.key)
      }
    ];
  }
}
