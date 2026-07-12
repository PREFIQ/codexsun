import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { PrioritiesService } from "./priorities.service.js";
import type { PrioritiesListFilters, PrioritiesSavePayload } from "./priorities.types.js";

export const PRIORITIES_COLLECTION_PATH = "/core/common/others/priorities";
const service = new PrioritiesService();

export async function registerPrioritiesRoutes(app: FastifyInstance) {
  app.get(PRIORITIES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/others/priorities/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(PRIORITIES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as PrioritiesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/others/priorities/:id`, async (request) =>
    ok(await service.update(id(request), request.body as PrioritiesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/others/priorities/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/others/priorities/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/others/priorities/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): PrioritiesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "PRIORITIES_NOT_FOUND", message: "Priorities record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
