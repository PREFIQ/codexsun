import type { State } from "./state.types.js";

export const stateEvents = {
  created: "core.common.location.state.created",
  statusChanged: "core.common.location.state.status_changed",
  updated: "core.common.location.state.updated"
} as const;

export function createStateEvent(eventName: (typeof stateEvents)[keyof typeof stateEvents], state: State) {
  return { eventName, payload: state, tenantId: state.tenantId, version: 1 };
}

