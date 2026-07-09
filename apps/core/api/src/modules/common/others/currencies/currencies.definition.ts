import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const currenciesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    },
    {
      "key": "symbol",
      "column": "symbol",
      "label": "Symbol",
      "type": "string",
      "required": true
    }
  ],
  "group": "others",
  "key": "currencies",
  "label": "Currencies",
  "path": "/core/common/others/currencies",
  "seeds": [
    {
      "name": "INR",
      "symbol": "₹"
    },
    {
      "name": "USD",
      "symbol": "$"
    }
  ],
  "tableName": "core_common_currencies"
};
