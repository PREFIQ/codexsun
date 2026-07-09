import { CommonMasterService } from "../../foundation/common-master.service.js";
import { currenciesDefinition } from "./currencies.definition.js";
export class CurrenciesService extends CommonMasterService { constructor() { super(currenciesDefinition); } }
