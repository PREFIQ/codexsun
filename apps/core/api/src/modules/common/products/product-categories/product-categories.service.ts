import { CommonMasterService } from "../../foundation/common-master.service.js";
import { productCategoriesDefinition } from "./product-categories.definition.js";
export class ProductCategoriesService extends CommonMasterService { constructor() { super(productCategoriesDefinition); } }
