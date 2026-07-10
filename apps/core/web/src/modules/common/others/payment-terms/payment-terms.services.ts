import { createCommonMaster, listCommonMaster, updateCommonMaster } from "../../../common-master/common-master.services";
import { paymentTermsDefinition } from "./payment-terms.definition";
export const listPaymentTerms = () => listCommonMaster(paymentTermsDefinition.path);
export const createPaymentTerms = (payload: Record<string, boolean | number | string | null>) => createCommonMaster(paymentTermsDefinition.path, payload);
export const updatePaymentTerms = (id: string, payload: Record<string, boolean | number | string | null>) => updateCommonMaster(paymentTermsDefinition.path, id, payload);
