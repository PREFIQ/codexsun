import type { CommonModuleRegistration } from "./common.types.js";

export const commonEvents = {
  areaRegistered: "core.common.area.registered"
} as const;

export function createCommonAreaRegisteredEvent(registration: CommonModuleRegistration) {
  return {
    eventName: commonEvents.areaRegistered,
    payload: registration,
    version: 1
  };
}

