import type { CommonMasterDefinition } from "../../../common-master";
export const contactTypesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "contacts",
  "key": "contactTypes",
  "label": "Contact Types",
  "path": "/core/common/contacts/contact-types",
  "route": "core.common.contacts.contact_types"
};
