import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { sizesDefinition } from "./sizes.definition.js";
export class SizesRepository extends CommonMasterRepository { constructor() { super(sizesDefinition); } }
