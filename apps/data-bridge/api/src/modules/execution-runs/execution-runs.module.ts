import type { FastifyInstance } from "fastify";
import { registerExecutionRunsRoutes } from "./execution-runs.routes.js";

export const executionRunsModule = Object.freeze({
  key: "data-bridge.execution-runs",
  scope: "platform",
  capabilities: ["checkpoint", "resume", "conflict-quarantine", "idempotent-transfer"]
});

export function registerExecutionRunsModule(app: FastifyInstance) {
  return registerExecutionRunsRoutes(app);
}
