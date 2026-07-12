import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const prioritiesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    },
    {
      "key": "colour",
      "column": "colour",
      "label": "Colour",
      "type": "string",
      "required": true
    },
    {
      "key": "tag",
      "column": "tag",
      "label": "Tag",
      "type": "string",
      "required": true
    }
  ],
  "group": "others",
  "key": "priorities",
  "label": "Priorities",
  "path": "/core/common/others/priorities",
  "seeds": [
    {
      "name": "High",
      "colour": "#dc2626",
      "tag": "HIGH"
    },
    {
      "name": "Normal",
      "colour": "#2563eb",
      "tag": "NORMAL"
    },
    {
      "name": "Low",
      "colour": "#16a34a",
      "tag": "LOW"
    }
  ],
  "tableName": "priorities"
};
