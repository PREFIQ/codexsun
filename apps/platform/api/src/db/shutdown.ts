import type { ShutdownHook } from "@codexsun/framework/api";

const hooks: ShutdownHook[] = [];

/** Register a hook to run when the API shuts down (e.g. close DB pool). */
export function registerDatabaseShutdownHook(hook: ShutdownHook): void {
  hooks.push(hook);
}

export function getDatabaseShutdownHooks(): ShutdownHook[] {
  return hooks;
}
