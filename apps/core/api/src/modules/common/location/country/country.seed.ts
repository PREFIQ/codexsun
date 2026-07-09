import { countryLocationDefinition } from "../location.definitions.js";
import { countrySeeds } from "../location.seed-data.js";
import { seedLocationRecord } from "../shared/location.repository.js";

export const countrySeed = {
  description: "Seed global country records with India first.",
  key: "core.common.location.country.seed"
};

export async function seedCountryModule() {
  for (const country of countrySeeds) {
    await seedLocationRecord(countryLocationDefinition.tableName, country);
  }
}

