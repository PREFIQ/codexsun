import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const destinationsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "workorder",
  "key": "destinations",
  "label": "Destinations",
  "path": "/core/common/workorder/destinations",
  "seeds": [
    {
      "name": "Local"
    }
  ],
  "tableName": "destinations"
};
