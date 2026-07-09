import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const contactGroupsDefinition: CommonMasterDefinition = {
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
  "key": "contactGroups",
  "label": "Contact Groups",
  "path": "/core/common/contacts/contact-groups",
  "seeds": [
    {
      "name": "General"
    },
    {
      "name": "Customer"
    },
    {
      "name": "Supplier"
    }
  ],
  "tableName": "core_common_contact_groups"
};
