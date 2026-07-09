import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { destinationsDefinition } from "./destinations.definition.js";
export class DestinationsRepository extends CommonMasterRepository { constructor() { super(destinationsDefinition); } }
