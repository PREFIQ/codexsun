import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const bankNamesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "contacts",
  "key": "bankNames",
  "label": "Bank Names",
  "path": "/core/common/contacts/bank-names",
  "seeds": [
    {
      "name": "State Bank of India"
    },
    {
      "name": "HDFC Bank"
    },
    {
      "name": "ICICI Bank"
    }
  ],
  "tableName": "core_common_bank_names"
};
