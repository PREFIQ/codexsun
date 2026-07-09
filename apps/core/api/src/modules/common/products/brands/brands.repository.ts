import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { brandsDefinition } from "./brands.definition.js";
export class BrandsRepository extends CommonMasterRepository { constructor() { super(brandsDefinition); } }
