import { districtLocationDefinition } from "../location.definitions.js";
import { LocationService } from "../shared/location.service.js";
import { DistrictRepository } from "./district.repository.js";

export class DistrictService extends LocationService {
  constructor() {
    super(districtLocationDefinition, new DistrictRepository());
  }
}

