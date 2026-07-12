import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { TransportsService } from "./transports.service.js";
import type { TransportsListFilters, TransportsSavePayload } from "./transports.types.js";

export const TRANSPORTS_COLLECTION_PATH = "/core/common/workorder/transports";
const service = new TransportsService();

export async function registerTransportsRoutes(app: FastifyInstance) {
  app.get(TRANSPORTS_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/workorder/transports/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(TRANSPORTS_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as TransportsSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/workorder/transports/:id`, async (request) =>
    ok(await service.update(id(request), request.body as TransportsSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/workorder/transports/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/workorder/transports/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/workorder/transports/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): TransportsListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "TRANSPORTS_NOT_FOUND", message: "Transports record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
