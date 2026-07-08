import { sql, type Kysely } from "kysely";
import type { CoreDatabase } from "../../database/core-database.js";

export const countrySeed = {
  key: "core.country.seed",
  description: "Country module seeds default master records into the configured database."
};

const defaultCountries = [
  { capital: "New Delhi", currencyCode: "INR", dialCode: "+91", iso2: "IN", iso3: "IND", name: "India", numericCode: "356" },
  { capital: "Washington, D.C.", currencyCode: "USD", dialCode: "+1", iso2: "US", iso3: "USA", name: "United States", numericCode: "840" }
] as const;

export async function seedCountryModule(database: Kysely<CoreDatabase>) {
  for (const country of defaultCountries) {
    await database
      .insertInto("core_countries")
      .values({
        capital: country.capital,
        currency_code: country.currencyCode,
        dial_code: country.dialCode,
        id: `country-${country.iso2.toLowerCase()}`,
        iso2: country.iso2,
        iso3: country.iso3,
        name: country.name,
        numeric_code: country.numericCode,
        status: "active"
      })
      .onDuplicateKeyUpdate({
        capital: country.capital,
        currency_code: country.currencyCode,
        dial_code: country.dialCode,
        iso3: country.iso3,
        name: country.name,
        numeric_code: country.numericCode,
        status: sql`status`
      })
      .execute();
  }
}
