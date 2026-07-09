import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { productGroupsDefinition } from "./product-groups.definition.js";
export class ProductGroupsRepository extends CommonMasterRepository { constructor() { super(productGroupsDefinition); } }
