import { CommonMasterService } from "../../foundation/common-master.service.js";
import { productGroupsDefinition } from "./product-groups.definition.js";
export class ProductGroupsService extends CommonMasterService { constructor() { super(productGroupsDefinition); } }
