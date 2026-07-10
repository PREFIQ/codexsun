import type { CommonMasterDefinition } from "../../../common-master";
export const productGroupsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "products",
  "key": "productGroups",
  "label": "Product Groups",
  "path": "/core/common/products/product-groups",
  "route": "core.common.products.product_groups"
};
