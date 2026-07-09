import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { bankNamesDefinition } from "./bank-names.definition.js";
export class BankNamesRepository extends CommonMasterRepository { constructor() { super(bankNamesDefinition); } }
