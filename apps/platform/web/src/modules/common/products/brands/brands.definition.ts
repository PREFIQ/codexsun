import type { CommonMasterDefinition } from "../../../common-master";
export const brandsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "products",
  "key": "brands",
  "label": "Brands",
  "path": "/core/common/products/brands",
  "route": "core.common.products.brands"
};
