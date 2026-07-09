import { cityLocationDefinition } from "../location.definitions.js";
import { LocationRepository } from "../shared/location.repository.js";

export class CityRepository extends LocationRepository {
  constructor() {
    super(cityLocationDefinition);
  }
}

