import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { prioritiesDefinition } from "./priorities.definition.js";
export class PrioritiesRepository extends CommonMasterRepository { constructor() { super(prioritiesDefinition); } }
