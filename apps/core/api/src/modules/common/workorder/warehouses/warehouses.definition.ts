import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const warehousesDefinition: CommonMasterDefinition = {
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
  "key": "warehouses",
  "label": "Warehouses",
  "path": "/core/common/workorder/warehouses",
  "seeds": [
    {
      "name": "Main Warehouse"
    }
  ],
  "tableName": "core_common_warehouses"
};
