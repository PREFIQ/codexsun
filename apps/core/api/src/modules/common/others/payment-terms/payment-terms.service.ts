import { CommonMasterService } from "../../foundation/common-master.service.js";
import { paymentTermsDefinition } from "./payment-terms.definition.js";
export class PaymentTermsService extends CommonMasterService { constructor() { super(paymentTermsDefinition); } }
