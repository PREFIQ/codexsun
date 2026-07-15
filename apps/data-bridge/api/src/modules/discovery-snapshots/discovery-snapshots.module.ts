import type { FastifyInstance } from "fastify";
import { registerDiscoverySnapshotRoutes } from "./discovery-snapshots.routes.js";

export const discoverySnapshotsModule = Object.freeze({
  key: "data-bridge.discovery-snapshots",
  scope: "platform"
});
export function registerDiscoverySnapshotsModule(app: FastifyInstance) {
  return registerDiscoverySnapshotRoutes(app);
}
