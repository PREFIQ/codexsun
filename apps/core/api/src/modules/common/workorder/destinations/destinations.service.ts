import { CommonMasterService } from "../../foundation/common-master.service.js";
import { destinationsDefinition } from "./destinations.definition.js";
export class DestinationsService extends CommonMasterService { constructor() { super(destinationsDefinition); } }
