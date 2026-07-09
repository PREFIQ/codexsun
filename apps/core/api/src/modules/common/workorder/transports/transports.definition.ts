import type { CommonMasterDefinition } from "../../foundation/common-master.types.js";

export const transportsDefinition: CommonMasterDefinition = {
  "fields": [
    {
      "key": "name",
      "column": "name",
      "label": "Name",
      "type": "string",
      "required": true
    },
    {
      "key": "gst",
      "column": "gst",
      "label": "GST",
      "type": "string",
      "required": false
    },
    {
      "key": "vehicleNo",
      "column": "vehicle_no",
      "label": "Vehicle number",
      "type": "string",
      "required": false
    },
    {
      "key": "address",
      "column": "address",
      "label": "Address",
      "type": "string",
      "required": false
    },
    {
      "key": "contactNo",
      "column": "contact_no",
      "label": "Contact number",
      "type": "string",
      "required": false
    },
    {
      "key": "contactPerson",
      "column": "contact_person",
      "label": "Contact person",
      "type": "string",
      "required": false
    }
  ],
  "group": "workorder",
  "key": "transports",
  "label": "Transports",
  "path": "/core/common/workorder/transports",
  "seeds": [
    {
      "name": "Self"
    }
  ],
  "tableName": "core_common_transports"
};
