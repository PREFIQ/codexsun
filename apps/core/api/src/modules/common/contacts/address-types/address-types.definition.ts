import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const addressTypesDefinition: CommonMasterDefinition = {
  "allowGlobalMutations": true,
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
  "key": "addressTypes",
  "label": "Address Types",
  "path": "/core/common/contacts/address-types",
  "seeds": [
    {
      "name": "-"
    },
    {
      "name": "Billing"
    },
    {
      "name": "Shipping"
    },
    {
      "name": "Office"
    }
  ],
  "tableName": "address_types"
};
