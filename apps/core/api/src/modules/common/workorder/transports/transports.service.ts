import { CommonMasterService } from "../../foundation/common-master.service.js";
import { transportsDefinition } from "./transports.definition.js";
export class TransportsService extends CommonMasterService { constructor() { super(transportsDefinition); } }
