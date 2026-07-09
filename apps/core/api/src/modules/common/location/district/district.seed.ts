import { districtLocationDefinition } from "../location.definitions.js";
import { districtSeeds } from "../location.seed-data.js";
import { seedLocationRecord } from "../shared/location.repository.js";

export const districtSeed = {
  description: "Seed Tamil Nadu districts plus unknown default.",
  key: "core.common.location.district.seed"
};

export async function seedDistrictModule() {
  for (const district of districtSeeds) {
    await seedLocationRecord(districtLocationDefinition.tableName, district);
  }
}

