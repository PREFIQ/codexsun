import { cityLocationDefinition } from "../location.definitions.js";
import { LocationService } from "../shared/location.service.js";
import { CityRepository } from "./city.repository.js";

export class CityService extends LocationService {
  constructor() {
    super(cityLocationDefinition, new CityRepository());
  }
}

