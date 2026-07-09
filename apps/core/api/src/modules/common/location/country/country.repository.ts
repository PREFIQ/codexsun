import { countryLocationDefinition } from "../location.definitions.js";
import { LocationRepository } from "../shared/location.repository.js";

export class CountryRepository extends LocationRepository {
  constructor() {
    super(countryLocationDefinition);
  }
}

