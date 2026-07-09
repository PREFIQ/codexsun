import { districtLocationDefinition } from "../location.definitions.js";
import { LocationRepository } from "../shared/location.repository.js";

export class DistrictRepository extends LocationRepository {
  constructor() {
    super(districtLocationDefinition);
  }
}

