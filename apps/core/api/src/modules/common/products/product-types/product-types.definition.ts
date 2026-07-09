import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const productTypesDefinition: CommonMasterDefinition = {
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
  "key": "productTypes",
  "label": "Product Types",
  "path": "/core/common/products/product-types",
  "seeds": [
    {
      "name": "Goods"
    },
    {
      "name": "Service"
    }
  ],
  "tableName": "core_common_product_types"
};
