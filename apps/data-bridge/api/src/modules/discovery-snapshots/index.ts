export { registerDiscoverySnapshotsModule } from "./discovery-snapshots.module.js";
export type { SchemaColumn, SchemaTable, TableDifference } from "./discovery-snapshots.types.js";

export async function getDiscoverySnapshotForMapping(id: number) {
  const { DiscoverySnapshotsService } = await import("./discovery-snapshots.service.js");
  return new DiscoverySnapshotsService().get(id);
}
