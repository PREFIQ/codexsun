import { stateLocationDefinition } from "../location.definitions.js";
import { LocationService } from "../shared/location.service.js";
import { StateRepository } from "./state.repository.js";

export class StateService extends LocationService {
  constructor() {
    super(stateLocationDefinition, new StateRepository());
  }
}

