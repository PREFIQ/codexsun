import type { MasterKind } from "./master.types.js";

export const masterEventNames = {
  created: "core.master.created",
  updated: "core.master.updated"
} as const;

export function createMasterEvent(kind: MasterKind, uuid: string, tenantId: string) {
  return {
    name: masterEventNames.created,
    payload: { kind, tenantId, uuid }
  };
}
