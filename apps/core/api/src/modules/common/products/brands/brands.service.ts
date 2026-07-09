import { CommonMasterService } from "../../foundation/common-master.service.js";
import { brandsDefinition } from "./brands.definition.js";
export class BrandsService extends CommonMasterService { constructor() { super(brandsDefinition); } }
