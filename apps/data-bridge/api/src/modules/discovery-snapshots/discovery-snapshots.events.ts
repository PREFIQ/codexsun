export function createDiscoverySnapshotEvent(snapshotId: number, action: string) {
  return {
    name: `data-bridge.discovery.${action}`,
    snapshotId,
    occurredAt: new Date().toISOString()
  };
}
