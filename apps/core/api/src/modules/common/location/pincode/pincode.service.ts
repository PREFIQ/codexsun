import { pincodeLocationDefinition } from "../location.definitions.js";
import { LocationService } from "../shared/location.service.js";
import { PincodeRepository } from "./pincode.repository.js";

export class PincodeService extends LocationService {
  constructor() {
    super(pincodeLocationDefinition, new PincodeRepository());
  }
}

