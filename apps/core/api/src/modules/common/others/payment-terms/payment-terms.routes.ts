import { createCommonMasterRoutes } from "../../foundation/common-master.routes.js";
import { paymentTermsDefinition } from "./payment-terms.definition.js";
export const registerPaymentTermsRoutes = createCommonMasterRoutes(paymentTermsDefinition);
