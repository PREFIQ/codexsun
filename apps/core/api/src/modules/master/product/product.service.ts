import { MasterService } from "../master.service.js";
import { productDefinition } from "./product.definition.js";
export class ProductService extends MasterService { constructor() { super(productDefinition); } }
