import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { requireSuperAdmin } from "../../auth/super-admin.guard.js";
import { AppOrchestrationService } from "./app-orchestration.service.js";
import type { OrchestratedAppId } from "./app-orchestration.types.js";
import type { ServiceId } from "./app-orchestration.repository.js";
const service = new AppOrchestrationService();
export async function registerAppOrchestrationRoutes(app: FastifyInstance) {
  app.get("/admin/app-operations", { preHandler: requireSuperAdmin }, async (request) =>
    ok(await service.list(), { requestId: request.id })
  );
  app.get(
    "/admin/app-operations/:id",
    { preHandler: requireSuperAdmin },
    async (request, reply) => {
      const item = await service.get((request.params as { id: string }).id);
      return item
        ? ok(item, { requestId: request.id })
        : reply.code(404).send({
            success: false,
            error: { code: "APP_NOT_FOUND", message: "Repository app was not found." }
          });
    }
  );
  for (const action of ["start", "stop", "update"] as const)
    app.post(
      `/admin/app-operations/:id/${action}`,
      { preHandler: requireSuperAdmin },
      async (request) =>
        ok(await service[action]((request.params as { id: OrchestratedAppId }).id), {
          requestId: request.id
        })
    );
  for (const action of ["startService", "stopService", "restartService"] as const) {
    const routeAction =
      action === "startService" ? "start" : action === "stopService" ? "stop" : "restart";
    app.post(
      `/admin/app-operations/:id/services/:serviceId/${routeAction}`,
      { preHandler: requireSuperAdmin },
      async (request) => {
        const params = request.params as { id: OrchestratedAppId; serviceId: ServiceId };
        return ok(await service[action](params.id, params.serviceId), { requestId: request.id });
      }
    );
  }
}
