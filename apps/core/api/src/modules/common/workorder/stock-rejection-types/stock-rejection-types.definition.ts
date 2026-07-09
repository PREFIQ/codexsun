import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const stockRejectionTypesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "workorder",
  "key": "stockRejectionTypes",
  "label": "Stock Rejection Types",
  "path": "/core/common/workorder/stock-rejection-types",
  "seeds": [
    {
      "name": "Damaged"
    },
    {
      "name": "Quality issue"
    }
  ],
  "tableName": "core_common_stock_rejection_types"
};
