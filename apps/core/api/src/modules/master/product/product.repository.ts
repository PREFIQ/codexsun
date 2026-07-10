import { MasterRepository } from "../master.repository.js";
import { productDefinition } from "./product.definition.js";
export class ProductRepository extends MasterRepository { constructor() { super(productDefinition); } }
