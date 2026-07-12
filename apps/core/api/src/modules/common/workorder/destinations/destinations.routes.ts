import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { DestinationsService } from "./destinations.service.js";
import type { DestinationsListFilters, DestinationsSavePayload } from "./destinations.types.js";

export const DESTINATIONS_COLLECTION_PATH = "/core/common/workorder/destinations";
const service = new DestinationsService();

export async function registerDestinationsRoutes(app: FastifyInstance) {
  app.get(DESTINATIONS_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/workorder/destinations/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(DESTINATIONS_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as DestinationsSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/workorder/destinations/:id`, async (request) =>
    ok(await service.update(id(request), request.body as DestinationsSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/workorder/destinations/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/workorder/destinations/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/workorder/destinations/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): DestinationsListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "DESTINATIONS_NOT_FOUND", message: "Destinations record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
