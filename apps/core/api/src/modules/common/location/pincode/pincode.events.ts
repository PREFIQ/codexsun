import type { Pincode } from "./pincode.types.js";

export const pincodeEvents = {
  created: "core.common.location.pincode.created",
  statusChanged: "core.common.location.pincode.status_changed",
  updated: "core.common.location.pincode.updated"
} as const;

export function createPincodeEvent(eventName: (typeof pincodeEvents)[keyof typeof pincodeEvents], pincode: Pincode) {
  return { eventName, payload: pincode, tenantId: pincode.tenantId, version: 1 };
}

