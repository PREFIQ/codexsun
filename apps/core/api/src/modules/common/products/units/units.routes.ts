import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { UnitsService } from "./units.service.js";
import type { UnitsListFilters, UnitsSavePayload } from "./units.types.js";

export const UNITS_COLLECTION_PATH = "/core/common/products/units";
const service = new UnitsService();

export async function registerUnitsRoutes(app: FastifyInstance) {
  app.get(UNITS_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/products/units/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(UNITS_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as UnitsSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/products/units/:id`, async (request) =>
    ok(await service.update(id(request), request.body as UnitsSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/products/units/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/products/units/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/products/units/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): UnitsListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "UNITS_NOT_FOUND", message: "Units record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
