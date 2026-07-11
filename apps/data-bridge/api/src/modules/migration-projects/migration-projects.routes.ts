import type { FastifyInstance } from "fastify";
import type { MigrationProjectsService } from "./migration-projects.service.js";

export async function registerMigrationProjectsRoutes(
  app: FastifyInstance,
  service: MigrationProjectsService
) {
  app.get("/data-bridge/workflow", async () => ({ data: service.getWorkflow() }));
  app.post<{ Body: Parameters<MigrationProjectsService["assertExecutionGate"]>[0] }>(
    "/data-bridge/execution-gate",
    async (request) => ({ data: service.assertExecutionGate(request.body) })
  );
}
