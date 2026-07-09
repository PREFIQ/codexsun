import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const addressTypesDefinition: CommonMasterDefinition = {
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
      "name": "Billing"
    },
    {
      "name": "Shipping"
    },
    {
      "name": "Office"
    }
  ],
  "tableName": "core_common_address_types"
};
