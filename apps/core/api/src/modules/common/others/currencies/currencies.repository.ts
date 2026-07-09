import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { currenciesDefinition } from "./currencies.definition.js";
export class CurrenciesRepository extends CommonMasterRepository { constructor() { super(currenciesDefinition); } }
