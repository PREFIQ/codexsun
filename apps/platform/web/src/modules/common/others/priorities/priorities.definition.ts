import type { CommonMasterDefinition } from "../../../common-master";
export const prioritiesDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    },
    {
      "key": "colour",
      "label": "Colour",
      "type": "color",
      "required": true
    },
    {
      "key": "tag",
      "label": "Tag",
      "type": "string",
      "required": true
    }
  ],
  "group": "others",
  "key": "priorities",
  "label": "Priorities",
  "path": "/core/common/others/priorities",
  "route": "core.common.others.priorities"
};
