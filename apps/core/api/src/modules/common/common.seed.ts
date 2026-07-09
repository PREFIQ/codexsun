import { seedLocationModules } from "./location/location.seed.js";
import { commonMasterDefinitions } from "./common-master.registry.js";
import { seedCommonMaster } from "./foundation/common-master.seed.js";

export const commonSeed = {
  description: "Common module aggregator seed behavior.",
  key: "core.common.seed"
};

export async function seedCommonModule() {
  await seedLocationModules();
  for (const definition of commonMasterDefinitions) {
    await seedCommonMaster(definition);
  }
}
