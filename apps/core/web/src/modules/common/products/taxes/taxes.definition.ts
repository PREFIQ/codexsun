import type { CommonMasterDefinition } from "../../../common-master";
export const taxesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "ratePercent",
      "label": "Rate percent",
      "type": "number",
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
  "key": "taxes",
  "label": "Taxes",
  "path": "/core/common/products/taxes",
  "route": "core.common.products.taxes"
};
