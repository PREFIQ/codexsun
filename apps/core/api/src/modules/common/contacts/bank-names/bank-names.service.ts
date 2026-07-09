import { CommonMasterService } from "../../foundation/common-master.service.js";
import { bankNamesDefinition } from "./bank-names.definition.js";
export class BankNamesService extends CommonMasterService { constructor() { super(bankNamesDefinition); } }
