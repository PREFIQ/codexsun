import type { FastifyInstance } from "fastify";
import { ok } from "@codexsun/framework/http";
import { QueueManagerService } from "./queue-manager.service.js";

const service = new QueueManagerService();

export async function registerQueueManagerRoutes(app: FastifyInstance) {
  app.get("/admin/queue/settings", async (request) => ok(await service.runtimeSettings(), { requestId: request.id }));
  app.get("/admin/queue/jobs", async (request) => ok(await service.listJobs(), { requestId: request.id }));
  app.post("/admin/queue/jobs/:id/run", async (request, reply) => {
    const job = await service.runJob(Number((request.params as { id: string }).id));
    if (!job) return reply.code(404).send(notFound("QUEUE_JOB_NOT_FOUND", "Queue job was not found.", request.id));
    return ok(job, { requestId: request.id });
  });
  app.post("/admin/queue/jobs/:id/retry", async (request, reply) => {
    const job = await service.retryJob(Number((request.params as { id: string }).id));
    if (!job) return reply.code(404).send(notFound("QUEUE_JOB_NOT_FOUND", "Queue job was not found.", request.id));
    return ok(job, { requestId: request.id });
  });
  app.post("/admin/queue/jobs/:id/cancel", async (request, reply) => {
    const job = await service.cancelJob(Number((request.params as { id: string }).id));
    if (!job) return reply.code(404).send(notFound("QUEUE_JOB_NOT_FOUND", "Queue job was not found.", request.id));
    return ok(job, { requestId: request.id });
  });
}

function notFound(code: string, message: string, requestId: string) {
  return { error: { code, message }, meta: { requestId, timestamp: new Date().toISOString() }, success: false as const };
}
