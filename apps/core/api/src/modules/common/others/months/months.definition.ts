import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const monthsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "others",
  "key": "months",
  "label": "Months",
  "path": "/core/common/others/months",
  "seeds": [
    {
      "name": "January"
    },
    {
      "name": "February"
    },
    {
      "name": "March"
    },
    {
      "name": "April"
    },
    {
      "name": "May"
    },
    {
      "name": "June"
    },
    {
      "name": "July"
    },
    {
      "name": "August"
    },
    {
      "name": "September"
    },
    {
      "name": "October"
    },
    {
      "name": "November"
    },
    {
      "name": "December"
    }
  ],
  "tableName": "core_common_months"
};
