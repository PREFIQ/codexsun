export function transformsSyncDecision() {
  return { direction: "server-only", offline: false, conflictPolicy: "approved-checksum-wins" };
}
