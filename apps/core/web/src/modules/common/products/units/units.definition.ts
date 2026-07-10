import type { CommonMasterDefinition } from "../../../common-master";
export const unitsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "products",
  "key": "units",
  "label": "Units",
  "path": "/core/common/products/units",
  "route": "core.common.products.units"
};
