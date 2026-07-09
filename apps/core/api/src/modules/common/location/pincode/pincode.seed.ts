import { pincodeLocationDefinition } from "../location.definitions.js";
import { pincodeSeeds } from "../location.seed-data.js";
import { seedLocationRecord } from "../shared/location.repository.js";

export const pincodeSeed = {
  description: "Seed independent pincode records for Tiruppur, Coimbatore, and Chennai.",
  key: "core.common.location.pincode.seed"
};

export async function seedPincodeModule() {
  for (const pincode of pincodeSeeds) {
    await seedLocationRecord(pincodeLocationDefinition.tableName, pincode);
  }
}

