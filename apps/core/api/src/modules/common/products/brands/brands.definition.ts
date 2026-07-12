import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const brandsDefinition: CommonMasterDefinition = {
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
  "key": "brands",
  "label": "Brands",
  "path": "/core/common/products/brands",
  "seeds": [
    {
      "name": "General"
    }
  ],
  "tableName": "brands"
};
