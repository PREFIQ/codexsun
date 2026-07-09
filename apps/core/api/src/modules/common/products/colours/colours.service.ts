import { CommonMasterService } from "../../foundation/common-master.service.js";
import { coloursDefinition } from "./colours.definition.js";
export class ColoursService extends CommonMasterService { constructor() { super(coloursDefinition); } }
