import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const sizesDefinition: CommonMasterDefinition = {
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
  "key": "sizes",
  "label": "Sizes",
  "path": "/core/common/products/sizes",
  "seeds": [
    {
      "name": "Standard"
    }
  ],
  "tableName": "sizes"
};
