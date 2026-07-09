import { cityLocationDefinition } from "../location.definitions.js";
import { citySeeds } from "../location.seed-data.js";
import { seedLocationRecord } from "../shared/location.repository.js";

export const citySeed = {
  description: "Seed Tamil Nadu major cities plus unknown default.",
  key: "core.common.location.city.seed"
};

export async function seedCityModule() {
  for (const city of citySeeds) {
    await seedLocationRecord(cityLocationDefinition.tableName, city);
  }
}

