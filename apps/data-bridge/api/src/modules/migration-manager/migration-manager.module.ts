import type { FastifyInstance } from "fastify";
import { registerMigrationManagerRoutes } from "./migration-manager.routes.js";

export const migrationManagerModule = Object.freeze({
  key: "data-bridge.migration-manager",
  scope: "platform"
});
export function registerMigrationManagerModule(app: FastifyInstance) {
  return registerMigrationManagerRoutes(app);
}
