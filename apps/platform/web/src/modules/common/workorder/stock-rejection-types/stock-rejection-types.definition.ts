import type { CommonMasterDefinition } from "../../../common-master";
export const stockRejectionTypesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "workorder",
  "key": "stockRejectionTypes",
  "label": "Stock Rejection Types",
  "path": "/core/common/workorder/stock-rejection-types",
  "route": "core.common.workorder.stock_rejection_types"
};
