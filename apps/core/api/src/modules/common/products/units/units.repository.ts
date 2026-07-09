import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { unitsDefinition } from "./units.definition.js";
export class UnitsRepository extends CommonMasterRepository { constructor() { super(unitsDefinition); } }
