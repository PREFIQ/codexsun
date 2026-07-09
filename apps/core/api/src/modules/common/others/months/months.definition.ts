import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const monthsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    },
    {
      "key": "fromDate",
      "column": "from_date",
      "label": "From date",
      "type": "date",
      "required": true
    },
    {
      "key": "toDate",
      "column": "to_date",
      "label": "To date",
      "type": "date",
      "required": true
    }
  ],
  "group": "others",
  "key": "months",
  "label": "Months",
  "path": "/core/common/others/months",
  "seeds": [
    {
      "name": "April-2026",
      "fromDate": "2026-04-01",
      "toDate": "2026-04-30"
    },
    {
      "name": "May-2026",
      "fromDate": "2026-05-01",
      "toDate": "2026-05-31"
    },
    {
      "name": "June-2026",
      "fromDate": "2026-06-01",
      "toDate": "2026-06-30"
    },
    {
      "name": "July-2026",
      "fromDate": "2026-07-01",
      "toDate": "2026-07-31"
    },
    {
      "name": "August-2026",
      "fromDate": "2026-08-01",
      "toDate": "2026-08-31"
    },
    {
      "name": "September-2026",
      "fromDate": "2026-09-01",
      "toDate": "2026-09-30"
    },
    {
      "name": "October-2026",
      "fromDate": "2026-10-01",
      "toDate": "2026-10-31"
    },
    {
      "name": "November-2026",
      "fromDate": "2026-11-01",
      "toDate": "2026-11-30"
    },
    {
      "name": "December-2026",
      "fromDate": "2026-12-01",
      "toDate": "2026-12-31"
    },
    {
      "name": "January-2027",
      "fromDate": "2027-01-01",
      "toDate": "2027-01-31"
    },
    {
      "name": "February-2027",
      "fromDate": "2027-02-01",
      "toDate": "2027-02-28"
    },
    {
      "name": "March-2027",
      "fromDate": "2027-03-01",
      "toDate": "2027-03-31"
    }
  ],
  "tableName": "core_common_months"
};
