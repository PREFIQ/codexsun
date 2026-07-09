import { useCommonMasterQuery } from "../../../common-master/common-master.hooks";
import { paymentTermsDefinition } from "./payment-terms.definition";
export function usePaymentTermsQuery() { return useCommonMasterQuery(paymentTermsDefinition.key, paymentTermsDefinition.path); }
