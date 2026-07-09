import { CommonMasterService } from "../../foundation/common-master.service.js";
import { prioritiesDefinition } from "./priorities.definition.js";
export class PrioritiesService extends CommonMasterService { constructor() { super(prioritiesDefinition); } }
