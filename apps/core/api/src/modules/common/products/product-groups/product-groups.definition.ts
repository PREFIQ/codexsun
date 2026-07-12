import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const productGroupsDefinition: CommonMasterDefinition = {
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
  "key": "productGroups",
  "label": "Product Groups",
  "path": "/core/common/products/product-groups",
  "seeds": [
    {
      "name": "General"
    }
  ],
  "tableName": "product_groups"
};
