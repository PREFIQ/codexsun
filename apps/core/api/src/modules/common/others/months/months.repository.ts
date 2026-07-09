import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { monthsDefinition } from "./months.definition.js";
export class MonthsRepository extends CommonMasterRepository { constructor() { super(monthsDefinition); } }
