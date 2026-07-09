import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const taxesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "ratePercent",
      "column": "rate_percent",
      "label": "Rate percent",
      "type": "number",
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
  "key": "taxes",
  "label": "Taxes",
  "path": "/core/common/products/taxes",
  "seeds": [
    {
      "ratePercent": 0,
      "description": "GST 0%"
    },
    {
      "ratePercent": 5,
      "description": "GST 5%"
    },
    {
      "ratePercent": 12,
      "description": "GST 12%"
    },
    {
      "ratePercent": 18,
      "description": "GST 18%"
    }
  ],
  "tableName": "core_common_taxes"
};
