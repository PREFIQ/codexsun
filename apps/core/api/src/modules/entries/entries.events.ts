import type { EntryKind } from "./entries.types.js";

export const entriesEvents = {
  changed: "core.entries.changed",
  converted: "core.entries.converted"
} as const;

export type EntriesEventAction = "created" | "updated" | "status-changed" | "converted";

export function createEntriesEvent(action: EntriesEventAction, payload: { id: string; kind: EntryKind; tenantId: string }) {
  return {
    name: action === "converted" ? entriesEvents.converted : entriesEvents.changed,
    occurredAt: new Date().toISOString(),
    payload: { action, ...payload },
    version: 1
  };
}
