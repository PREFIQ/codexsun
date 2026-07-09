import type { CommonMasterDefinition } from "../../../common-master";
export const destinationsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    }
  ],
  "group": "workorder",
  "key": "destinations",
  "label": "Destinations",
  "path": "/core/common/workorder/destinations",
  "route": "core.common.workorder.destinations"
};
