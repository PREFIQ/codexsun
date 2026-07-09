import { CommonMasterService } from "../../foundation/common-master.service.js";
import { sizesDefinition } from "./sizes.definition.js";
export class SizesService extends CommonMasterService { constructor() { super(sizesDefinition); } }
