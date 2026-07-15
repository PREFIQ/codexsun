export function migrationManagerSyncDecision() {
  return { direction: "server-only", offline: false, conflictPolicy: "server-job-wins" };
}
