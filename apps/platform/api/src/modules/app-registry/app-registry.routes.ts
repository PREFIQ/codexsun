import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { AppRegistryService } from "./app-registry.service.js";
import type { PlatformAppSavePayload } from "./app-registry.types.js";

const service = new AppRegistryService();

export async function registerAppRegistryRoutes(app: FastifyInstance) {
  app.get("/admin/apps", async (request) => ok(await service.listApps(), { requestId: request.id }));
  app.post("/admin/apps", async (request) => ok(await service.createApp(request.body as PlatformAppSavePayload), { requestId: request.id }));
  app.put("/admin/apps/:id", async (request, reply) => {
    const appRecord = await service.updateApp((request.params as { id: string }).id, request.body as PlatformAppSavePayload);
    if (!appRecord) return reply.code(404).send(notFound("APP_NOT_FOUND", "App was not found.", request.id));
    return ok(appRecord, { requestId: request.id });
  });
}

function notFound(code: string, message: string, requestId: string) {
  return { error: { code, message }, meta: { requestId, timestamp: new Date().toISOString() }, success: false as const };
}
