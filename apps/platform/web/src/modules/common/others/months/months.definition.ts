import type { CommonMasterDefinition } from "../../../common-master";
export const monthsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    },
    {
      "key": "fromDate",
      "label": "From date",
      "type": "date",
      "required": true
    },
    {
      "key": "toDate",
      "label": "To date",
      "type": "date",
      "required": true
    }
  ],
  "group": "others",
  "key": "months",
  "label": "Months",
  "path": "/core/common/others/months",
  "route": "core.common.others.months"
};
