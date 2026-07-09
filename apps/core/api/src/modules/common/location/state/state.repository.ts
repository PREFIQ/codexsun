import { stateLocationDefinition } from "../location.definitions.js";
import { LocationRepository } from "../shared/location.repository.js";

export class StateRepository extends LocationRepository {
  constructor() {
    super(stateLocationDefinition);
  }
}

