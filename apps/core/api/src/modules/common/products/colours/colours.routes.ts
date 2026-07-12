import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { ColoursService } from "./colours.service.js";
import type { ColoursListFilters, ColoursSavePayload } from "./colours.types.js";

export const COLOURS_COLLECTION_PATH = "/core/common/products/colours";
const service = new ColoursService();

export async function registerColoursRoutes(app: FastifyInstance) {
  app.get(COLOURS_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/products/colours/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(COLOURS_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as ColoursSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/products/colours/:id`, async (request) =>
    ok(await service.update(id(request), request.body as ColoursSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/products/colours/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/products/colours/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/products/colours/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): ColoursListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "COLOURS_NOT_FOUND", message: "Colours record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
