import { pincodeLocationDefinition } from "../location.definitions.js";
import { LocationRepository } from "../shared/location.repository.js";

export class PincodeRepository extends LocationRepository {
  constructor() {
    super(pincodeLocationDefinition);
  }
}

