import type { CommonMasterDefinition } from "../../../common-master";
export const addressTypesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "contacts",
  "key": "addressTypes",
  "label": "Address Types",
  "path": "/core/common/contacts/address-types",
  "route": "core.common.contacts.address_types"
};
