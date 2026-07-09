import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const coloursDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "products",
  "key": "colours",
  "label": "Colours",
  "path": "/core/common/products/colours",
  "seeds": [
    {
      "name": "Black"
    },
    {
      "name": "White"
    },
    {
      "name": "Blue"
    }
  ],
  "tableName": "core_common_colours"
};
