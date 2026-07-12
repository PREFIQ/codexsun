import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const salesTypesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    },
    {
      "key": "description",
      "column": "description",
      "label": "Description",
      "type": "string",
      "required": false
    }
  ],
  "group": "others",
  "key": "salesTypes",
  "label": "Sales Types",
  "path": "/core/common/others/sales-types",
  "seeds": [
    {
      "name": "Retail",
      "description": "Retail sale"
    },
    {
      "name": "Wholesale",
      "description": "Wholesale sale"
    }
  ],
  "tableName": "sales_types"
};
