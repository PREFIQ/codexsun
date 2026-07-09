import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const stylesDefinition: CommonMasterDefinition = {
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
  "key": "styles",
  "label": "Styles",
  "path": "/core/common/products/styles",
  "seeds": [
    {
      "name": "Standard"
    }
  ],
  "tableName": "core_common_styles"
};
