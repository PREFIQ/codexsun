import type { CommonMasterDefinition } from "../../../common-master";
export const sizesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "products",
  "key": "sizes",
  "label": "Sizes",
  "path": "/core/common/products/sizes",
  "route": "core.common.products.sizes"
};
