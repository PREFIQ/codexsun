import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";

export const countrySeed = {
  description: "Seed country records with the unknown fallback first.",
  key: "core.common.location.country.seed"
};

export async function seedCountryModule() {
  for (const country of countrySeeds) {
    await sql`INSERT INTO countries (code, name, sort_order, status)
      VALUES (${country.code}, ${country.name}, ${country.sortOrder}, ${country.status})
      ON DUPLICATE KEY UPDATE name=VALUES(name), sort_order=VALUES(sort_order), status=VALUES(status)`.execute(
      getCoreDatabase()
    );
  }
}

const countrySeeds = [
  { code: "UNKNOWN", name: "-", sortOrder: 0, status: "active" as const },
  { code: "IN", name: "India", sortOrder: 1, status: "active" as const },
  { code: "US", name: "United States", sortOrder: 20, status: "active" as const },
  { code: "GB", name: "United Kingdom", sortOrder: 30, status: "active" as const },
  { code: "AE", name: "United Arab Emirates", sortOrder: 40, status: "active" as const },
  { code: "SG", name: "Singapore", sortOrder: 50, status: "active" as const },
  { code: "AU", name: "Australia", sortOrder: 60, status: "active" as const }
];
