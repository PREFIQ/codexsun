import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { coloursDefinition } from "./colours.definition.js";
export class ColoursRepository extends CommonMasterRepository { constructor() { super(coloursDefinition); } }
