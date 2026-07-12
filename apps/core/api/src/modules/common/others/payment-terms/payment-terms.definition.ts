import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const paymentTermsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "others",
  "key": "paymentTerms",
  "label": "Payment Terms",
  "path": "/core/common/others/payment-terms",
  "seeds": [
    {
      "name": "Immediate"
    },
    {
      "name": "Net 15"
    },
    {
      "name": "Net 30"
    }
  ],
  "tableName": "payment_terms"
};
