import type { CommonMasterDefinition } from "../../../common-master";
export const bankNamesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "contacts",
  "key": "bankNames",
  "label": "Bank Names",
  "path": "/core/common/contacts/bank-names",
  "route": "core.common.contacts.bank_names"
};
