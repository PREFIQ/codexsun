import type { CommonMasterDefinition } from "../../../common-master";
export const paymentTermsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "others",
  "key": "paymentTerms",
  "label": "Payment Terms",
  "path": "/core/common/others/payment-terms",
  "route": "core.common.others.payment_terms"
};
