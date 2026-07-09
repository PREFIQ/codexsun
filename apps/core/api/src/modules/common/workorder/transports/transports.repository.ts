import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { transportsDefinition } from "./transports.definition.js";
export class TransportsRepository extends CommonMasterRepository { constructor() { super(transportsDefinition); } }
