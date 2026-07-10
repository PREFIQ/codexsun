import type { CommonMasterDefinition } from "../../../common-master";
export const hsnCodesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "code",
      "label": "Code",
      "type": "string",
      "required": true
    },
    {
      "key": "description",
      "label": "Description",
      "type": "string",
      "required": true
    }
  ],
  "group": "products",
  "key": "hsnCodes",
  "label": "HSN Codes",
  "path": "/core/common/products/hsn-codes",
  "route": "core.common.products.hsn_codes"
};
