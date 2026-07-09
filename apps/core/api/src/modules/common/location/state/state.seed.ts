import { stateLocationDefinition } from "../location.definitions.js";
import { stateSeeds } from "../location.seed-data.js";
import { seedLocationRecord } from "../shared/location.repository.js";

export const stateSeed = {
  description: "Seed Indian states and union territories with GST state codes.",
  key: "core.common.location.state.seed"
};

export async function seedStateModule() {
  for (const state of stateSeeds) {
    await seedLocationRecord(stateLocationDefinition.tableName, state);
  }
}

