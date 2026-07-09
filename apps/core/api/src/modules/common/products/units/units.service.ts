import { CommonMasterService } from "../../foundation/common-master.service.js";
import { unitsDefinition } from "./units.definition.js";
export class UnitsService extends CommonMasterService { constructor() { super(unitsDefinition); } }
