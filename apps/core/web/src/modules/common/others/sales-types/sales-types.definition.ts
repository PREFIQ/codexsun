import type { CommonMasterDefinition } from "../../../common-master";
export const salesTypesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    },
    {
      "key": "description",
      "label": "Description",
      "type": "string",
      "required": false
    }
  ],
  "group": "others",
  "key": "salesTypes",
  "label": "Sales Types",
  "path": "/core/common/others/sales-types",
  "route": "core.common.others.sales_types"
};
