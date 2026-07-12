import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const contactGroupsDefinition: CommonMasterDefinition = {
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
  "key": "contactGroups",
  "label": "Contact Groups",
  "path": "/core/common/contacts/contact-groups",
  "seeds": [
    {
      "name": "-"
    },
    {
      "name": "Business"
    },
    {
      "name": "Web Clients"
    }
  ],
  "tableName": "contact_groups"
};
