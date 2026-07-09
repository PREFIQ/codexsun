import { CommonMasterRepository } from "../../foundation/common-master.repository.js";
import { paymentTermsDefinition } from "./payment-terms.definition.js";
export class PaymentTermsRepository extends CommonMasterRepository { constructor() { super(paymentTermsDefinition); } }
