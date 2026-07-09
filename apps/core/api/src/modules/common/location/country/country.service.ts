import { countryLocationDefinition } from "../location.definitions.js";
import { CountryRepository } from "./country.repository.js";
import { LocationService } from "../shared/location.service.js";

export class CountryService extends LocationService {
  constructor() {
    super(countryLocationDefinition, new CountryRepository());
  }
}

