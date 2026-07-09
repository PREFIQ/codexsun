import type { CommonMasterDefinition } from "../../../common-master";
export const currenciesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "others",
  "key": "currencies",
  "label": "Currencies",
  "path": "/core/common/others/currencies",
  "route": "core.common.others.currencies"
};
