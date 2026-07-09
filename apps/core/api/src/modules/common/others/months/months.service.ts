import { CommonMasterService } from "../../foundation/common-master.service.js";
import { monthsDefinition } from "./months.definition.js";
export class MonthsService extends CommonMasterService { constructor() { super(monthsDefinition); } }
