import type { CommonMasterDefinition } from "../../../common-master";
export const workOrderTypesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "workorder",
  "key": "workOrderTypes",
  "label": "Work Order Types",
  "path": "/core/common/workorder/work-order-types",
  "route": "core.common.workorder.work_order_types"
};
