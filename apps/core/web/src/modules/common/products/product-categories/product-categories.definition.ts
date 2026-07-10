import type { CommonMasterDefinition } from "../../../common-master";
export const productCategoriesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "products",
  "key": "productCategories",
  "label": "Product Categories",
  "path": "/core/common/products/product-categories",
  "route": "core.common.products.product_categories"
};
