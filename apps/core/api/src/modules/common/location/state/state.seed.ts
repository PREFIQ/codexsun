import { sql } from "kysely";
import { getCoreDatabase } from "../../../../database/core-database.js";

export const stateSeed = {
  description: "Seed Indian states and union territories.",
  key: "core.common.location.state.seed"
};

export async function seedStateModule() {
  const countries = await sql<{
    id: number;
  }>`SELECT id FROM countries WHERE code = 'IN' LIMIT 1`.execute(getCoreDatabase());
  const countryId = countries.rows[0]?.id;
  if (!countryId) throw new Error("India country seed must exist before state seeds are applied.");

  for (const state of stateSeeds) {
    await sql`INSERT INTO states (country_id, name, sort_order, status)
      VALUES (${countryId}, ${state.name}, ${state.sortOrder}, ${state.status})
      ON DUPLICATE KEY UPDATE country_id=VALUES(country_id), name=VALUES(name), sort_order=VALUES(sort_order), status=VALUES(status)`.execute(
      getCoreDatabase()
    );
  }
}

const stateSeeds = [
  { code: "UNKNOWN", name: "-", sortOrder: 0, status: "active" as const },
  { code: "01", name: "Jammu and Kashmir", sortOrder: 1, status: "active" as const },
  { code: "02", name: "Himachal Pradesh", sortOrder: 2, status: "active" as const },
  { code: "03", name: "Punjab", sortOrder: 3, status: "active" as const },
  { code: "04", name: "Chandigarh", sortOrder: 4, status: "active" as const },
  { code: "05", name: "Uttarakhand", sortOrder: 5, status: "active" as const },
  { code: "06", name: "Haryana", sortOrder: 6, status: "active" as const },
  { code: "07", name: "Delhi", sortOrder: 7, status: "active" as const },
  { code: "08", name: "Rajasthan", sortOrder: 8, status: "active" as const },
  { code: "09", name: "Uttar Pradesh", sortOrder: 9, status: "active" as const },
  { code: "10", name: "Bihar", sortOrder: 10, status: "active" as const },
  { code: "11", name: "Sikkim", sortOrder: 11, status: "active" as const },
  { code: "12", name: "Arunachal Pradesh", sortOrder: 12, status: "active" as const },
  { code: "13", name: "Nagaland", sortOrder: 13, status: "active" as const },
  { code: "14", name: "Manipur", sortOrder: 14, status: "active" as const },
  { code: "15", name: "Mizoram", sortOrder: 15, status: "active" as const },
  { code: "16", name: "Tripura", sortOrder: 16, status: "active" as const },
  { code: "17", name: "Meghalaya", sortOrder: 17, status: "active" as const },
  { code: "18", name: "Assam", sortOrder: 18, status: "active" as const },
  { code: "19", name: "West Bengal", sortOrder: 19, status: "active" as const },
  { code: "20", name: "Jharkhand", sortOrder: 20, status: "active" as const },
  { code: "21", name: "Odisha", sortOrder: 21, status: "active" as const },
  { code: "22", name: "Chhattisgarh", sortOrder: 22, status: "active" as const },
  { code: "23", name: "Madhya Pradesh", sortOrder: 23, status: "active" as const },
  { code: "24", name: "Gujarat", sortOrder: 24, status: "active" as const },
  {
    code: "26",
    name: "Dadra and Nagar Haveli and Daman and Diu",
    sortOrder: 26,
    status: "active" as const
  },
  { code: "27", name: "Maharashtra", sortOrder: 27, status: "active" as const },
  { code: "29", name: "Karnataka", sortOrder: 29, status: "active" as const },
  { code: "30", name: "Goa", sortOrder: 30, status: "active" as const },
  { code: "31", name: "Lakshadweep", sortOrder: 31, status: "active" as const },
  { code: "32", name: "Kerala", sortOrder: 32, status: "active" as const },
  { code: "33", name: "Tamil Nadu", sortOrder: 33, status: "active" as const },
  { code: "34", name: "Puducherry", sortOrder: 34, status: "active" as const },
  { code: "35", name: "Andaman and Nicobar Islands", sortOrder: 35, status: "active" as const },
  { code: "36", name: "Telangana", sortOrder: 36, status: "active" as const },
  { code: "37", name: "Andhra Pradesh", sortOrder: 37, status: "active" as const },
  { code: "38", name: "Ladakh", sortOrder: 38, status: "active" as const },
  { code: "97", name: "Other Territory", sortOrder: 97, status: "active" as const }
];
