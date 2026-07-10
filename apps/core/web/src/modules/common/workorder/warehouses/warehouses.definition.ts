import type { CommonMasterDefinition } from "../../../common-master";
export const warehousesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "workorder",
  "key": "warehouses",
  "label": "Warehouses",
  "path": "/core/common/workorder/warehouses",
  "route": "core.common.workorder.warehouses"
};
