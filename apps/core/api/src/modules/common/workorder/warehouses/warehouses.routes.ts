import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { WarehousesService } from "./warehouses.service.js";
import type { WarehousesListFilters, WarehousesSavePayload } from "./warehouses.types.js";

export const WAREHOUSES_COLLECTION_PATH = "/core/common/workorder/warehouses";
const service = new WarehousesService();

export async function registerWarehousesRoutes(app: FastifyInstance) {
  app.get(WAREHOUSES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/workorder/warehouses/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(WAREHOUSES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as WarehousesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/workorder/warehouses/:id`, async (request) =>
    ok(await service.update(id(request), request.body as WarehousesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/workorder/warehouses/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/workorder/warehouses/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/workorder/warehouses/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): WarehousesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "WAREHOUSES_NOT_FOUND", message: "Warehouses record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
