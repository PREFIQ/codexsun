import { CommonMasterService } from "../../foundation/common-master.service.js";
import { productTypesDefinition } from "./product-types.definition.js";
export class ProductTypesService extends CommonMasterService { constructor() { super(productTypesDefinition); } }
