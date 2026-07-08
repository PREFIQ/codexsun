import { getCoreDatabase, type CoreCountriesTable } from "../../database/core-database.js";
import type { Country, CountrySavePayload } from "./country.types.js";

export class CountryRepository {
  async list() {
    const rows = await getCoreDatabase().selectFrom("core_countries").selectAll().orderBy("name", "asc").execute();
    return rows.map(toCountry);
  }

  async create(input: CountrySavePayload) {
    const country: Country = {
      ...input,
      id: `country-${input.iso2.toLowerCase()}`
    };
    await getCoreDatabase().insertInto("core_countries").values(toCountryRow(country)).execute();
    return country;
  }

  async update(id: string, input: CountrySavePayload) {
    const existing = await getCoreDatabase().selectFrom("core_countries").select("id").where("id", "=", id).executeTakeFirst();
    if (!existing) return null;
    const country = { ...input, id };
    await getCoreDatabase().updateTable("core_countries").set(toCountryRow(country)).where("id", "=", id).execute();
    return country;
  }

  async setStatus(id: string, status: Country["status"]) {
    const existing = await getCoreDatabase().selectFrom("core_countries").selectAll().where("id", "=", id).executeTakeFirst();
    if (!existing) return null;
    await getCoreDatabase().updateTable("core_countries").set({ status }).where("id", "=", id).execute();
    return { ...toCountry(existing), status };
  }
}

function toCountry(row: CoreCountriesTable): Country {
  return {
    capital: row.capital,
    currencyCode: row.currency_code,
    dialCode: row.dial_code,
    id: row.id,
    iso2: row.iso2,
    iso3: row.iso3,
    name: row.name,
    numericCode: row.numeric_code,
    status: row.status
  };
}

function toCountryRow(country: Country): CoreCountriesTable {
  return {
    capital: country.capital,
    currency_code: country.currencyCode,
    dial_code: country.dialCode,
    id: country.id,
    iso2: country.iso2,
    iso3: country.iso3,
    name: country.name,
    numeric_code: country.numericCode,
    status: country.status
  };
}
