import type { CommonMasterDefinition } from "../../../common-master";
export const contactGroupsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "contacts",
  "key": "contactGroups",
  "label": "Contact Groups",
  "path": "/core/common/contacts/contact-groups",
  "route": "core.common.contacts.contact_groups"
};
