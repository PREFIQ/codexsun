import { CountryRepository } from "./country.repository.js";
import type { CountrySavePayload } from "./country.types.js";

export class CountryService {
  constructor(private readonly repository = new CountryRepository()) {}

  async listCountries() {
    return this.repository.list();
  }

  async createCountry(input: CountrySavePayload) {
    return this.repository.create(this.normalize(input));
  }

  async updateCountry(id: string, input: CountrySavePayload) {
    return this.repository.update(id, this.normalize(input));
  }

  async activateCountry(id: string) {
    return this.repository.setStatus(id, "active");
  }

  async deactivateCountry(id: string) {
    return this.repository.setStatus(id, "inactive");
  }

  private normalize(input: CountrySavePayload): CountrySavePayload {
    return {
      capital: input.capital?.trim() || null,
      currencyCode: input.currencyCode.trim().toUpperCase(),
      dialCode: input.dialCode.trim(),
      iso2: input.iso2.trim().toUpperCase(),
      iso3: input.iso3.trim().toUpperCase(),
      name: input.name.trim(),
      numericCode: input.numericCode.trim(),
      status: input.status
    };
  }
}
