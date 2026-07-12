import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const productCategoriesDefinition: CommonMasterDefinition = {
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
  "key": "productCategories",
  "label": "Product Categories",
  "path": "/core/common/products/product-categories",
  "seeds": [
    {
      "name": "General"
    }
  ],
  "tableName": "product_categories"
};
