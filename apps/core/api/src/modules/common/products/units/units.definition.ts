import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const unitsDefinition: CommonMasterDefinition = {
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
  "key": "units",
  "label": "Units",
  "path": "/core/common/products/units",
  "seeds": [
    {
      "name": "Nos"
    },
    {
      "name": "Kg"
    },
    {
      "name": "Meter"
    },
    {
      "name": "Litre"
    }
  ],
  "tableName": "core_common_units"
};
