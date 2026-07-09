import { seedCommonMaster } from "../../foundation/common-master.seed.js";
import { paymentTermsDefinition } from "./payment-terms.definition.js";
export function seedPaymentTerms() { return seedCommonMaster(paymentTermsDefinition); }
