import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { productTypesDefinition } from "./product-types.definition.js";
export class ProductTypesRepository extends CommonMasterRepository { constructor() { super(productTypesDefinition); } }
