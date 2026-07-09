import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const contactTypesDefinition: CommonMasterDefinition = {
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
  "key": "contactTypes",
  "label": "Contact Types",
  "path": "/core/common/contacts/contact-types",
  "seeds": [
    {
      "name": "Customer"
    },
    {
      "name": "Supplier"
    },
    {
      "name": "Employee"
    }
  ],
  "tableName": "core_common_contact_types"
};
