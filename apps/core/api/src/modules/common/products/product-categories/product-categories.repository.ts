import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { productCategoriesDefinition } from "./product-categories.definition.js";
export class ProductCategoriesRepository extends CommonMasterRepository { constructor() { super(productCategoriesDefinition); } }
