import type { FastifyInstance, FastifyRequest } from "fastify";
import { ok } from "@codexsun/framework/http";
import { SalesTypesService } from "./sales-types.service.js";
import type { SalesTypesListFilters, SalesTypesSavePayload } from "./sales-types.types.js";

export const SALES_TYPES_COLLECTION_PATH = "/core/common/others/sales-types";
const service = new SalesTypesService();

export async function registerSalesTypesRoutes(app: FastifyInstance) {
  app.get(SALES_TYPES_COLLECTION_PATH, async (request) =>
    ok(await service.list(filters(request)), { requestId: request.id })
  );
  app.get(`/core/common/others/sales-types/:id`, async (request, reply) => {
    const record = await service.get(id(request));
    return record
      ? ok(record, { requestId: request.id })
      : reply.code(404).send(notFound(request.id));
  });
  app.post(SALES_TYPES_COLLECTION_PATH, async (request) =>
    ok(await service.create(request.body as SalesTypesSavePayload), {
      requestId: request.id
    })
  );
  app.put(`/core/common/others/sales-types/:id`, async (request) =>
    ok(await service.update(id(request), request.body as SalesTypesSavePayload), {
      requestId: request.id
    })
  );
  app.post(`/core/common/others/sales-types/:id/activate`, async (request) =>
    ok(await service.setActive(id(request), true), { requestId: request.id })
  );
  app.post(`/core/common/others/sales-types/:id/deactivate`, async (request) =>
    ok(await service.setActive(id(request), false), { requestId: request.id })
  );
  app.delete(`/core/common/others/sales-types/:id/force`, async (request) =>
    ok(await service.forceDelete(id(request)), { requestId: request.id })
  );
}

function id(request: FastifyRequest) {
  return (request.params as { id: string }).id;
}
function filters(request: FastifyRequest): SalesTypesListFilters {
  const search = (request.query as { search?: string } | undefined)?.search;
  return search ? { search } : {};
}
function notFound(requestId: string) {
  return {
    error: { code: "SALES_TYPES_NOT_FOUND", message: "Sales Types record was not found." },
    meta: { requestId, timestamp: new Date().toISOString() },
    success: false as const
  };
}
