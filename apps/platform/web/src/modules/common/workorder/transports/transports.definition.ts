import type { CommonMasterDefinition } from "../../../common-master";
export const transportsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "label": "Name",
      "type": "string",
      "required": true
    },
    {
      "key": "gst",
      "label": "GST",
      "type": "string",
      "required": false
    },
    {
      "key": "vehicleNo",
      "label": "Vehicle number",
      "type": "string",
      "required": false
    },
    {
      "key": "address",
      "label": "Address",
      "type": "string",
      "required": false
    },
    {
      "key": "contactNo",
      "label": "Contact number",
      "type": "string",
      "required": false
    },
    {
      "key": "contactPerson",
      "label": "Contact person",
      "type": "string",
      "required": false
    }
  ],
  "group": "workorder",
  "key": "transports",
  "label": "Transports",
  "path": "/core/common/workorder/transports",
  "route": "core.common.workorder.transports"
};
