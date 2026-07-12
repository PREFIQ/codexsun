import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const hsnCodesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "code",
      "column": "code",
      "label": "Code",
      "type": "string",
      "required": true
    },
    {
      "key": "description",
      "column": "description",
      "label": "Description",
      "type": "string",
      "required": true
    }
  ],
  "group": "products",
  "key": "hsnCodes",
  "label": "HSN Codes",
  "path": "/core/common/products/hsn-codes",
  "seeds": [
    {
      "code": "0000",
      "description": "General"
    }
  ],
  "tableName": "hsn_codes"
};
