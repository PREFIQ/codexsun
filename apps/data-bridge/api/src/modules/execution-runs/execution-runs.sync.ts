export function executionRunSyncDecision() {
  return { direction: "server-only", conflictPolicy: "stop-table", offline: false };
}
