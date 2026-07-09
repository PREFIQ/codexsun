import type { CommonMasterDefinition } from "../../../common-master";
export const productTypesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "products",
  "key": "productTypes",
  "label": "Product Types",
  "path": "/core/common/products/product-types",
  "route": "core.common.products.product_types"
};
