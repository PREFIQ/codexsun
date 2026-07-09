import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const workOrderTypesDefinition: CommonMasterDefinition = {
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
  "key": "workOrderTypes",
  "label": "Work Order Types",
  "path": "/core/common/workorder/work-order-types",
  "seeds": [
    {
      "name": "General"
    }
  ],
  "tableName": "core_common_work_order_types"
};
