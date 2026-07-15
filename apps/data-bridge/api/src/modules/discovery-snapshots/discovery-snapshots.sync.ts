export function discoverySnapshotSyncDecision() {
  return { direction: "server-only", offline: false, conflictPolicy: "immutable-snapshot" };
}
